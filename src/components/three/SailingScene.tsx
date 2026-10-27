"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { VesselClass } from "@/data/schemas";
import { distanceNm, headingDifference } from "@/engine/geo";
import { windForDate } from "@/engine/wind";
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
  low: { dpr: [1, 1] as [number, number], shadows: false, oceanSegments: 140, shadowMap: 1024 },
  medium: { dpr: [1, 1.5] as [number, number], shadows: true, oceanSegments: 280, shadowMap: 2048 },
  high: { dpr: [1, 2] as [number, number], shadows: true, oceanSegments: 400, shadowMap: 4096 },
};

const REBASE_DISTANCE_M = 15_000;

/** Full-screen 3D sailing environment for the active ship. Rendered only on the client. */
export function SailingScene() {
  const quality = useSettingsStore((s) => s.quality);
  const camera = useSettingsStore((s) => s.camera);
  const q = QUALITY[quality];
  const scenario = useGameStore((s) => s.catalog?.scenario);
  const seed = useGameStore((s) => s.state?.seed ?? 0);
  if (!scenario) return null;

  return (
    <Canvas
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
      <Lighting shadowMap={q.shadowMap} shadows={q.shadows} />
      <SkyDome />
      <Ocean segments={q.oceanSegments} />
      <PlayerShip />
      <Wake />
      <BowFoam />
      <NavigationAids />
      <NearbyPorts />
      <TrafficShips era={scenario.era} seed={String(seed)} />
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
    const before = { x: frame.ship.x, z: frame.ship.z };
    const local = geoToScene(frame.origin, ship.position);
    if (Math.hypot(local.x, local.z) > REBASE_DISTANCE_M || (frame.origin.lat === 0 && frame.origin.lon === 0)) {
      frame.origin = { ...ship.position };
    }
    const p = geoToScene(frame.origin, ship.position);
    const sceneDelta = started.current ? { x: p.x - before.x, z: p.z - before.z } : { x: 0, z: 0 };
    started.current = true;

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
    const sample = waveSample(p.x, p.z, frame.wavePhases, frame.waveAmp);
    const damp = Math.min(1, 40 / length);
    const inertia = 1 - Math.exp(-realDt * (length > 120 ? 1.6 : 2.8));
    frame.ship.x = p.x;
    frame.ship.z = p.z;
    frame.ship.heading = ship.heading;
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

function Lighting({ shadowMap, shadows }: { shadowMap: number; shadows: boolean }) {
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

function SkyDome() {
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

/** Ports within visual range of the active ship, re-evaluated once a second. */
function NearbyPorts() {
  const [nearby, setNearby] = useState<Array<{ id: string; bearing: number }>>([]);
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
      const list: Array<{ id: string; bearing: number }> = [];
      for (const port of cat.ports) {
        const pp = { lat: port.latitude, lon: port.longitude };
        const d = distanceNm(ship.position, pp);
        if (d < 10) {
          // The land lies on the side away from the sea lane. For an arriving ship that is the
          // direction it approaches from (frozen at first sighting so the quay does not swing);
          // for a docked ship it is opposite the first leg of its plotted route, or, with no
          // route, along its starboard side.
          const existing = nearby.find((n) => n.id === port.id);
          let bearing: number;
          if (d < 0.3 && ship.status === "docked") {
            const next = ship.route[1];
            bearing = next ? (bearingTo(pp, next) + 180) % 360 : (ship.heading + 90) % 360;
          } else {
            bearing = existing?.bearing ?? bearingTo(ship.position, pp);
          }
          list.push({ id: port.id, bearing });
        }
      }
      if (list.length !== nearby.length || list.some((n, i) => n.id !== nearby[i]?.id || Math.abs(n.bearing - (nearby[i]?.bearing ?? 0)) > 0.5)) setNearby(list);
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [nearby]);
  if (!catalog) return null;
  return (
    <>
      {nearby.map((n) => {
        const port = catalog.portMap.get(n.id);
        return port ? <PortScenery key={n.id} port={port} era={era} approachBearing={n.bearing} /> : null;
      })}
    </>
  );
}

function bearingTo(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const la1 = (from.lat * Math.PI) / 180;
  const la2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
