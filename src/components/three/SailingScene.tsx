"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { VesselClass } from "@/data/schemas";
import { distanceNm, headingDifference, normalizeHeading, type GeoPoint } from "@/engine/geo";
import { harbourLayout, landBearing } from "@/engine/harbour";
import type { ShipStatus } from "@/engine/state";
import { windForDate } from "@/engine/wind";
import { DECISION_INTERVAL_SECONDS, nextQuality, perfSampler, recordFrame, resetSampler, sampleStats, SETTLE_SECONDS, type AdaptiveState, type EffectiveQuality } from "@/lib/perf";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { CameraRig } from "./CameraRig";
import { Ocean } from "./Ocean";
import { ProceduralShip } from "./ProceduralShip";
import { geoToScene, headingToRotationY, getSceneFrame } from "./scene-state";
import { PortScenery, RouteLine, TrafficShips, WaypointBuoy } from "./Scenery";
import { RivalTraffic } from "./RivalTraffic";
import { BowFoam, Wake } from "./Wake";
import { advanceWavePhases, waveSample } from "./waves";

const QUALITY = {
  // Ocean segments tessellate the 1.4 km sheet around the ship: 140 → 10 m cells, 280 → 5 m, 400 → 3.5 m.
  // Shadow maps cover the 800 m around the ship: 1024 texels is 0.8 m per texel, 2048 is 0.4 m.
  low: { dpr: [1, 1] as [number, number], shadows: false, oceanSegments: 140, shadowMap: 1024 },
  medium: { dpr: [1, 1.5] as [number, number], shadows: true, oceanSegments: 280, shadowMap: 1024 },
  high: { dpr: [1, 2] as [number, number], shadows: true, oceanSegments: 400, shadowMap: 2048 },
};

/**
 * Resolves the graphics setting to a level. "auto" starts at medium and moves with the
 * measured frame time (rule in lib/perf.ts); a fixed setting is used as it is.
 */
function useEffectiveQuality(): EffectiveQuality {
  const setting = useSettingsStore((s) => s.quality);
  const pushToast = useGameStore((s) => s.pushToast);
  const [auto, setAuto] = useState<EffectiveQuality>("medium");
  const adaptive = useRef<AdaptiveState>({ level: "medium", fastWindows: 0 });
  const settledAt = useRef(0);

  useEffect(() => {
    if (setting !== "auto") return;
    settledAt.current = performance.now() + SETTLE_SECONDS * 1000;
    const id = window.setInterval(() => {
      if (performance.now() < settledAt.current || document.visibilityState !== "visible") return;
      const stats = sampleStats(perfSampler);
      if (stats.frames < 30 || stats.fps === 0) return;
      const next = nextQuality(adaptive.current, stats.avgMs);
      const changed = next.level !== adaptive.current.level;
      adaptive.current = next;
      if (changed) {
        settledAt.current = performance.now() + SETTLE_SECONDS * 1000;
        resetSampler(perfSampler);
        setAuto(next.level);
        if (next.level === "low" || stats.avgMs > 1000 / 30) pushToast({ kind: "info", title: `Graphics set to ${next.level}`, message: `Frames were taking ${stats.avgMs.toFixed(0)} ms. Choose a fixed level in Settings to override.` });
      }
    }, DECISION_INTERVAL_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [setting, pushToast]);

  const level = setting === "auto" ? auto : setting;
  useEffect(() => {
    perfSampler.level = level;
    perfSampler.auto = setting === "auto";
  }, [level, setting]);
  return level;
}

const REBASE_DISTANCE_M = 15_000;

/** Full-screen 3D sailing environment for the active ship. Rendered only on the client. */
export function SailingScene() {
  const quality = useEffectiveQuality();
  const camera = useSettingsStore((s) => s.camera);
  const q = QUALITY[quality];
  const catalog = useGameStore((s) => s.catalog);
  const scenario = catalog?.scenario;
  const trafficModels = useMemo(() => catalog?.ships.map((c) => c.model) ?? [], [catalog]);
  const seed = useGameStore((s) => s.state?.seed ?? 0);
  if (!scenario) return null;

  return (
    <Canvas
      // Remount on a level change so shadow setup and ocean tessellation take the new values.
      key={quality}
      dpr={q.dpr}
      shadows={q.shadows ? { type: THREE.PCFSoftShadowMap } : false}
      camera={{ fov: 55, near: 1, far: 20000, position: [0, 60, 220] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.78;
      }}
      className="h-full w-full"
    >
      <FrameUpdater />
      <FrameMeter />
      <Lighting shadowMap={q.shadowMap} shadows={q.shadows} />
      {quality === "low" ? <SimpleSky /> : <SkyDome />}
      <Ocean segments={q.oceanSegments} />
      <PlayerShip />
      <Wake />
      <BowFoam />
      <NavigationAids />
      <NearbyPorts />
      <TrafficShips era={scenario.era} models={trafficModels} seed={String(seed)} />
      <RivalTraffic />
      <CameraRig mode={camera} />
    </Canvas>
  );
}

/** Copies the game state into the shared frame once per rendered frame (no React re-renders). */
function FrameUpdater() {
  const fog = useRef<THREE.Fog>(null);
  const dusk = useMemo(() => new THREE.Color("#f2b27e"), []);
  const day = useMemo(() => new THREE.Color("#a7d3ea"), []);
  const night = useMemo(() => new THREE.Color("#2a3f63"), []);
  const sunWarm = useMemo(() => new THREE.Color("#ffb070"), []);
  const sunDay = useMemo(() => new THREE.Color("#fff3d6"), []);
  const started = useRef(false);
  const rawPrev = useRef({ x: 0, z: 0 });
  // Berthing and casting off change the ship's pose in one simulation step (alongside the
  // quay, or pointed down the fairway). The drawn ship eases into the new pose instead.
  const lastPose = useRef<{ status: ShipStatus; position: GeoPoint; heading: number } | null>(null);
  const glide = useRef({ x: 0, z: 0, heading: 0 });

  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const store = useGameStore.getState();
    const state = store.state;
    const catalog = store.catalog;
    if (!state || !catalog) return;
    const ship = state.active_ship_id ? state.ships[state.active_ship_id] : undefined;
    if (!ship) return;
    const cls = catalog.ships.find((c) => c.id === ship.class_id);

    // Floating origin: keep scene coordinates small. The wave phases absorb the jump so
    // the water does not visibly snap when the origin moves.
    const before = { x: rawPrev.current.x, z: rawPrev.current.z };
    const local = geoToScene(frame.origin, ship.position);
    if (Math.hypot(local.x, local.z) > REBASE_DISTANCE_M || (frame.origin.lat === 0 && frame.origin.lon === 0)) {
      frame.origin = { ...ship.position };
    }
    const p = geoToScene(frame.origin, ship.position);
    const sceneDelta = started.current ? { x: p.x - before.x, z: p.z - before.z } : { x: 0, z: 0 };
    started.current = true;
    rawPrev.current = { x: p.x, z: p.z };

    // Ease the drawn ship through a berthing or casting-off jump (real time, so the
    // animation completes even when arrival pauses the game).
    const last = lastPose.current;
    if (last && last.status !== ship.status && (ship.status === "docked" || last.status === "docked")) {
      const was = geoToScene(frame.origin, last.position);
      glide.current = { x: was.x - p.x, z: was.z - p.z, heading: headingDifference(ship.heading, last.heading) };
    }
    lastPose.current = { status: ship.status, position: ship.position, heading: ship.heading };
    const ease = Math.exp(-dt * 1.8);
    glide.current.x *= ease;
    glide.current.z *= ease;
    glide.current.heading *= ease;
    if (Math.abs(glide.current.x) < 0.05 && Math.abs(glide.current.z) < 0.05 && Math.abs(glide.current.heading) < 0.05) glide.current = { x: 0, z: 0, heading: 0 };

    // Real-time step: what the ship would cover this frame at its actual speed. The wave
    // field and the wake move relative to the ship by this amount, whatever the time scale.
    const realDt = state.paused ? 0 : dt;
    const h = (ship.heading * Math.PI) / 180;
    const mps = ship.speed_knots * 0.514444;
    frame.realStep.x = Math.sin(h) * mps * realDt;
    frame.realStep.z = -Math.cos(h) * mps * realDt;
    advanceWavePhases(frame.wavePhases, realDt, sceneDelta, frame.realStep);
    frame.waveClock += realDt;
    frame.paused = state.paused;
    frame.timeScale = state.time_scale;
    frame.simSeconds = state.sim_seconds;

    const wind = catalog.scenario.features.wind ? windForDate(catalog.scenario.wind, state.date.month, state.date.day) : { from: 240, speed_knots: 10 };
    frame.wind = wind;
    frame.waveAmp = 0.5 + Math.min(1.2, wind.speed_knots / 22);

    // Ride the waves: sample height and slope under the hull, damped by vessel size and
    // low-pass filtered so the hull answers the sea with some inertia.
    const length = cls?.length_m ?? 100;
    const sample = waveSample(p.x + glide.current.x, p.z + glide.current.z, frame.wavePhases, frame.waveAmp);
    const damp = Math.min(1, 40 / length);
    const inertia = 1 - Math.exp(-realDt * (length > 120 ? 1.6 : 2.8));
    frame.ship.x = p.x + glide.current.x;
    frame.ship.z = p.z + glide.current.z;
    frame.ship.heading = normalizeHeading(ship.heading + glide.current.heading);
    frame.ship.speed = ship.speed_knots;
    frame.ship.length = length;
    frame.ship.y += (sample.height * damp - frame.ship.y) * inertia;
    // Slope along and across the heading.
    const along = sample.slopeX * Math.sin(h) - sample.slopeZ * Math.cos(h);
    const across = sample.slopeX * Math.cos(h) + sample.slopeZ * Math.sin(h);
    const heel = ship.rudder * Math.min(ship.speed_knots, 25) * 0.004;
    frame.ship.pitch += (-along * damp * 0.9 - frame.ship.pitch) * inertia;
    frame.ship.roll += (across * damp * 1.2 + heel - frame.ship.roll) * inertia;

    // Time of day from the simulated clock (never fully dark so the scene stays readable).
    const hour = ((state.sim_seconds % 86400) + 86400) % 86400 / 3600;
    const dayFraction = Math.sin((Math.PI * (hour - 5.5)) / 13);
    const elevation = Math.max(5, dayFraction * 68);
    const azimuth = 90 + ((hour - 6) / 12) * 180;
    const el = (elevation * Math.PI) / 180;
    const az = (azimuth * Math.PI) / 180;
    frame.sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
    frame.sunElevation = elevation;
    const warmth = THREE.MathUtils.clamp((elevation - 5) / 25, 0, 1);
    const isNight = dayFraction < -0.05;
    frame.skyColor.copy(isNight ? night : dusk).lerp(day, isNight ? 0 : warmth);
    frame.sunColor.copy(sunWarm).lerp(sunDay, warmth);
    frame.fogColor.copy(frame.skyColor);
    if (fog.current) fog.current.color.copy(frame.fogColor);
  });
  return <fog ref={fog} attach="fog" args={["#9fcbe6", 1500, 7500]} />;
}

/** Records each rendered frame's time and the renderer's draw-call and triangle counts. */
function FrameMeter() {
  const gl = useThree((s) => s.gl);
  useFrame((_, dt) => {
    recordFrame(perfSampler, dt * 1000);
    perfSampler.drawCalls = gl.info.render.calls;
    perfSampler.triangles = gl.info.render.triangles;
  });
  return null;
}

export function Lighting({ shadowMap, shadows }: { shadowMap: number; shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const frame = getSceneFrame();
    const l = light.current;
    if (!l) return;
    l.position.set(frame.ship.x + frame.sunDir.x * 1200, frame.sunDir.y * 1200 + 50, frame.ship.z + frame.sunDir.z * 1200);
    target.position.set(frame.ship.x, 0, frame.ship.z);
    target.updateMatrixWorld();
    l.color.copy(frame.sunColor);
    l.intensity = 0.7 + Math.min(1, frame.sunElevation / 45) * 1.5;
  });
  return (
    <>
      <hemisphereLight args={["#9fc9ea", "#0b2a44", 0.7]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={light}
        castShadow={shadows}
        intensity={2.2}
        target={target}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-camera-near={100}
        shadow-camera-far={3000}
        shadow-camera-left={-400}
        shadow-camera-right={400}
        shadow-camera-top={400}
        shadow-camera-bottom={-400}
        shadow-bias={-0.0004}
      />
      <primitive object={target} />
    </>
  );
}

const SIMPLE_SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  // Pin the dome to the far plane so it never clips and never writes depth.
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = vec4(clip.xy, clip.w * 0.9999, clip.w);
}
`;
const SIMPLE_SKY_FRAGMENT = /* glsl */ `
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float up = clamp(d.y, 0.0, 1.0);
  // Horizon haze at the fog colour, deepening toward the zenith.
  vec3 color = mix(uHorizon, uZenith, pow(up, 0.45));
  float cosSun = max(dot(d, uSunDir), 0.0);
  // A soft glow around the sun and a small bright disc.
  color += uSunColor * (0.18 * pow(cosSun, 8.0) + 0.6 * pow(cosSun, 400.0));
  // Below the horizon the sea covers the dome; keep it the fog colour.
  color = mix(uHorizon, color, smoothstep(-0.02, 0.02, d.y));
  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * The low preset's sky: a gradient dome with a sun glow, a handful of operations per
 * pixel against the Preetham scattering shader's dozen powers and exponentials. It
 * follows the same per-frame sun and sky colours as the full sky, so the lighting and
 * the fog still match.
 */
function SimpleSky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SIMPLE_SKY_VERTEX,
        fragmentShader: SIMPLE_SKY_FRAGMENT,
        uniforms: {
          uHorizon: { value: new THREE.Color("#9fcbe6") },
          uZenith: { value: new THREE.Color("#2f6ea6") },
          uSunDir: { value: new THREE.Vector3(0.3, 0.6, 0.4).normalize() },
          uSunColor: { value: new THREE.Color("#fff1d0") },
        },
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
      }),
    [],
  );
  const mesh = useRef<THREE.Mesh>(null);
  const zenithDay = useMemo(() => new THREE.Color("#2f6ea6"), []);
  const zenithNight = useMemo(() => new THREE.Color("#0b1b33"), []);
  useFrame(({ camera }) => {
    const f = getSceneFrame();
    if (mesh.current) mesh.current.position.copy(camera.position);
    (material.uniforms.uHorizon!.value as THREE.Color).copy(f.fogColor);
    const dayness = THREE.MathUtils.clamp((f.sunElevation - 5) / 30, 0, 1);
    (material.uniforms.uZenith!.value as THREE.Color).copy(zenithNight).lerp(zenithDay, dayness);
    (material.uniforms.uSunDir!.value as THREE.Vector3).copy(f.sunDir);
    (material.uniforms.uSunColor!.value as THREE.Color).copy(f.sunColor);
  });
  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[9000, 24, 12]} />
    </mesh>
  );
}

export function SkyDome() {
  const [sun, setSun] = useState<[number, number, number]>([0.3, 0.3, 0.4]);
  const tick = useRef(0);
  useFrame((_, dt) => {
    tick.current += dt;
    if (tick.current > 0.5) {
      tick.current = 0;
      const f = getSceneFrame();
      setSun([f.sunDir.x, Math.max(0.02, f.sunDir.y), f.sunDir.z]);
    }
  });
  return <Sky distance={450000} sunPosition={sun} turbidity={9} rayleigh={0.55} mieCoefficient={0.0035} mieDirectionalG={0.86} />;
}

function PlayerShip() {
  const group = useRef<THREE.Group>(null);
  const ship = useGameStore((s) => (s.state?.active_ship_id ? s.state.ships[s.state.active_ship_id] : undefined));
  const cls: VesselClass | undefined = useGameStore((s) => {
    const sh = s.state?.active_ship_id ? s.state.ships[s.state.active_ship_id] : undefined;
    return sh ? s.catalog?.ships.find((c) => c.id === sh.class_id) : undefined;
  });
  const accent = useGameStore((s) => s.state?.empire.emblem.color ?? "#22d3ee");
  // Sail yaw is derived from the relative wind; updated at most a few times per second.
  const [sailYaw, setSailYaw] = useState(0);
  const [sailSet, setSailSet] = useState(1);
  const acc = useRef(0);

  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const g = group.current;
    if (!g) return;
    g.position.set(frame.ship.x, frame.ship.y, frame.ship.z);
    g.rotation.set(frame.ship.pitch, headingToRotationY(frame.ship.heading), frame.ship.roll);
    acc.current += dt;
    if (acc.current > 0.3 && cls?.propulsion === "sail") {
      acc.current = 0;
      const rel = headingDifference(frame.ship.heading, frame.wind.from); // where the wind comes from, relative to the bow
      const yaw = Math.sign(rel || 1) * (180 - Math.abs(rel)) * 0.45;
      setSailYaw(Math.round(yaw));
      const set = ship?.status === "docked" ? 0 : Math.max(0.15, ship?.throttle ?? 1);
      setSailSet(Math.round(set * 10) / 10);
    }
  });

  if (!ship || !cls) return null;
  return (
    <group ref={group}>
      <ProceduralShip model={cls.model} length={cls.length_m} sailYaw={sailYaw} sailSet={sailSet} accent={accent} seed={ship.id} />
    </group>
  );
}

function NavigationAids() {
  const route = useGameStore((s) => (s.state?.active_ship_id ? s.state.ships[s.state.active_ship_id]?.route : undefined));
  const index = useGameStore((s) => (s.state?.active_ship_id ? s.state.ships[s.state.active_ship_id]?.waypoint_index : undefined));
  const status = useGameStore((s) => (s.state?.active_ship_id ? s.state.ships[s.state.active_ship_id]?.status : undefined));
  if (!route || index === undefined || route.length < 2) return null;
  const next = route[Math.min(index, route.length - 1)];
  return (
    <>
      {status !== "docked" && next && <WaypointBuoy waypoint={next} />}
      <RouteLine route={route} fromIndex={Math.min(index, route.length - 1)} />
    </>
  );
}

/**
 * Ports within visual range of the active ship, re-evaluated once a second. Their land and
 * quay placement is fixed by the harbour model, so the scenery never swings with the ship.
 */
function NearbyPorts() {
  const [nearby, setNearby] = useState<string[]>([]);
  const catalog = useGameStore((s) => s.catalog);
  const era = catalog?.scenario.era ?? "modern";
  useEffect(() => {
    const update = () => {
      const st = useGameStore.getState();
      const state = st.state;
      const cat = st.catalog;
      if (!state || !cat || !state.active_ship_id) return;
      const ship = state.ships[state.active_ship_id];
      if (!ship) return;
      const list = cat.ports.filter((port) => distanceNm(ship.position, { lat: port.latitude, lon: port.longitude }) < 10);
      getSceneFrame().harbours = list.map((port) => ({ lat: port.latitude, lon: port.longitude, landBearing: landBearing(port), layout: harbourLayout(port.size) }));
      const ids = list.map((port) => port.id);
      setNearby((prev) => (prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!catalog) return null;
  return (
    <>
      {nearby.map((id) => {
        const port = catalog.portMap.get(id);
        return port ? <PortScenery key={id} port={port} era={era} /> : null;
      })}
    </>
  );
}
