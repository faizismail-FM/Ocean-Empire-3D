"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import { headingDifference } from "@/engine/geo";
import { cruiseSpeed, stepKinematics, type Kinematics } from "@/engine/ship";
import { DEMO_TIME_SCALE, demoHour, demoRudder, menuHelm, menuReadout, showcaseFor, type Showcase } from "@/lib/menu-demo";
import { Ocean } from "./Ocean";
import { ProceduralShip } from "./ProceduralShip";
import { Lighting, SkyDome } from "./SailingScene";
import { TrafficShips } from "./Scenery";
import { geoToScene, getSceneFrame, headingToRotationY } from "./scene-state";
import { BowFoam, Wake } from "./Wake";
import { advanceWavePhases, waveSample } from "./waves";

/**
 * The landing page's live sea: the same ocean, sky, hull builders and wake as the sailing
 * view, driven by a small demo helm instead of the game state. Nothing here touches a
 * save; the ship sails off its scenario's home port under a gentle autopilot until a
 * visitor takes the wheel.
 */

const REBASE_DISTANCE_M = 15_000;

export function MenuScene({ scenarioId, reducedMotion }: { scenarioId: string; reducedMotion: boolean }) {
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId) ?? ALL_SCENARIOS[0]!;
  const catalog = useMemo(() => getCatalog(scenario.id), [scenario.id]);
  const showcase = useMemo(() => showcaseFor(scenario, catalog), [scenario, catalog]);
  const trafficModels = useMemo(() => catalog.ships.map((c) => c.model), [catalog]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={false}
      camera={{ fov: 50, near: 1, far: 20000, position: [0, 40, 160] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.78;
      }}
      className="h-full w-full"
    >
      <DemoUpdater scenarioId={scenario.id} showcase={showcase} homePort={{ lat: catalog.portMap.get(scenario.home_port_id)?.latitude ?? 0, lon: catalog.portMap.get(scenario.home_port_id)?.longitude ?? 0 }} />
      <Lighting shadowMap={1024} shadows={false} />
      <SkyDome />
      <Ocean segments={200} />
      <DemoShip showcase={showcase} />
      <Wake />
      <BowFoam />
      <TrafficShips era={scenario.era} models={trafficModels} seed={`menu:${scenario.id}`} />
      <MenuCamera reducedMotion={reducedMotion} />
    </Canvas>
  );
}

/** Steps the demo ship and copies it into the shared scene frame once per rendered frame. */
function DemoUpdater({ scenarioId, showcase, homePort }: { scenarioId: string; showcase: Showcase; homePort: { lat: number; lon: number } }) {
  const fog = useRef<THREE.Fog>(null);
  const kin = useRef<Kinematics>({ position: { lat: homePort.lat + 0.08, lon: homePort.lon + 0.08 }, heading: 35, speed_knots: 0, throttle: 1, rudder: 0 });
  const clock = useRef(0);
  const started = useRef(false);
  const lastScenario = useRef<string | null>(null);
  const dusk = useMemo(() => new THREE.Color("#f2b27e"), []);
  const day = useMemo(() => new THREE.Color("#a7d3ea"), []);
  const sunWarm = useMemo(() => new THREE.Color("#ffb070"), []);
  const sunDay = useMemo(() => new THREE.Color("#fff3d6"), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const frame = getSceneFrame();
    const cls = showcase.cls;
    const k = kin.current;

    if (lastScenario.current !== scenarioId) {
      // A new vessel takes over on the same heading, a little off its home port, already under way.
      lastScenario.current = scenarioId;
      k.position = { lat: homePort.lat + 0.08, lon: homePort.lon + 0.08 };
      k.speed_knots = cruiseSpeed(cls) * 0.9;
      k.throttle = 1;
      frame.origin = { ...k.position };
      frame.ship.y = 0;
      frame.ship.pitch = 0;
      frame.ship.roll = 0;
      started.current = false;
    }

    clock.current += dt;
    const now = performance.now();
    const manual = menuHelm.manualUntil > now;
    k.rudder = manual ? menuHelm.rudder : demoRudder(clock.current);
    k.throttle = manual ? menuHelm.throttle : 1;
    const step = stepKinematics(cls, k, dt * DEMO_TIME_SCALE, cls.propulsion === "sail" ? showcase.wind : null);
    kin.current = step.kinematics;
    const next = kin.current;

    const before = { x: frame.ship.x, z: frame.ship.z };
    const local = geoToScene(frame.origin, next.position);
    if (Math.hypot(local.x, local.z) > REBASE_DISTANCE_M) frame.origin = { ...next.position };
    const p = geoToScene(frame.origin, next.position);
    const sceneDelta = started.current ? { x: p.x - before.x, z: p.z - before.z } : { x: 0, z: 0 };
    started.current = true;

    const h = (next.heading * Math.PI) / 180;
    const mps = next.speed_knots * 0.514444;
    frame.realStep.x = Math.sin(h) * mps * dt;
    frame.realStep.z = -Math.cos(h) * mps * dt;
    advanceWavePhases(frame.wavePhases, dt, sceneDelta, frame.realStep);
    frame.waveClock += dt;
    frame.paused = false;
    frame.timeScale = DEMO_TIME_SCALE;
    frame.simSeconds += dt * DEMO_TIME_SCALE;
    frame.wind = showcase.wind;
    frame.waveAmp = 0.5 + Math.min(1.2, showcase.wind.speed_knots / 22);

    const length = cls.length_m;
    const sample = waveSample(p.x, p.z, frame.wavePhases, frame.waveAmp);
    const damp = Math.min(1, 40 / length);
    const inertia = 1 - Math.exp(-dt * (length > 120 ? 1.6 : 2.8));
    frame.ship.x = p.x;
    frame.ship.z = p.z;
    frame.ship.heading = next.heading;
    frame.ship.speed = next.speed_knots;
    frame.ship.length = length;
    frame.ship.y += (sample.height * damp - frame.ship.y) * inertia;
    const along = sample.slopeX * Math.sin(h) - sample.slopeZ * Math.cos(h);
    const across = sample.slopeX * Math.cos(h) + sample.slopeZ * Math.sin(h);
    const heel = next.rudder * Math.min(next.speed_knots, 25) * 0.004;
    frame.ship.pitch += (-along * damp * 0.9 - frame.ship.pitch) * inertia;
    frame.ship.roll += (across * damp * 1.2 + heel - frame.ship.roll) * inertia;

    // A slow day: the sun climbs from dawn to noon and sets again over a few minutes.
    const hour = demoHour(clock.current);
    const dayFraction = Math.sin((Math.PI * (hour - 5.5)) / 13);
    const elevation = Math.max(5, dayFraction * 68);
    const azimuth = 90 + ((hour - 6) / 12) * 180;
    const el = (elevation * Math.PI) / 180;
    const az = (azimuth * Math.PI) / 180;
    frame.sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
    frame.sunElevation = elevation;
    const warmth = THREE.MathUtils.clamp((elevation - 5) / 25, 0, 1);
    frame.skyColor.copy(dusk).lerp(day, warmth);
    frame.sunColor.copy(sunWarm).lerp(sunDay, warmth);
    frame.fogColor.copy(frame.skyColor);
    if (fog.current) fog.current.color.copy(frame.fogColor);

    menuReadout.speedKnots = next.speed_knots;
    menuReadout.heading = next.heading;
    menuReadout.windFrom = showcase.wind.from;
    menuReadout.windKnots = showcase.wind.speed_knots;
    menuReadout.hour = hour;
    menuReadout.manual = manual;
    menuReadout.sailEfficiency = step.sail_efficiency;
  });

  return <fog ref={fog} attach="fog" args={["#9fcbe6", 1500, 7500]} />;
}

function DemoShip({ showcase }: { showcase: Showcase }) {
  const group = useRef<THREE.Group>(null);
  const [sailYaw, setSailYaw] = useState(0);
  const [sailSet, setSailSet] = useState(1);
  const acc = useRef(0);
  const cls = showcase.cls;

  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const g = group.current;
    if (!g) return;
    g.position.set(frame.ship.x, frame.ship.y, frame.ship.z);
    g.rotation.set(frame.ship.pitch, headingToRotationY(frame.ship.heading), frame.ship.roll);
    acc.current += dt;
    if (acc.current > 0.3 && cls.propulsion === "sail") {
      acc.current = 0;
      const rel = headingDifference(frame.ship.heading, frame.wind.from);
      setSailYaw(Math.round(Math.sign(rel || 1) * (180 - Math.abs(rel)) * 0.45));
      const t = menuHelm.manualUntil > performance.now() ? menuHelm.throttle : 1;
      setSailSet(Math.round(Math.max(0.15, t) * 10) / 10);
    }
  });

  return (
    <group ref={group}>
      <ProceduralShip model={cls.model} length={cls.length_m} sailYaw={sailYaw} sailSet={sailSet} accent={showcase.accent} seed={`menu-${cls.id}`} />
    </group>
  );
}

/** Orbit camera glued to the ship: drag to look around, scroll to zoom, and a slow turn when idle. */
function MenuCamera({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const orbit = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const target = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const lastLength = useRef(0);

  useEffect(() => {
    initialized.current = false;
  }, []);

  // On wide screens the menu panels fill the left and the top; shift the projection so the
  // orbit target (the ship) sits in the open water to the right and below the centre line.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width >= 768) cam.setViewOffset(size.width, size.height, -size.width * 0.24, -size.height * 0.14, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * 0.08, size.width, size.height);
    cam.updateProjectionMatrix();
    return () => {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
    };
  }, [camera, size.width, size.height]);

  useFrame(() => {
    const controls = orbit.current;
    if (!controls) return;
    const s = getSceneFrame().ship;
    const L = s.length;
    target.current.set(s.x, s.y + L * 0.06, s.z);
    offset.current.subVectors(camera.position, controls.target);
    if (!initialized.current || Math.abs(L - lastLength.current) > 1) {
      // First frame, or a different hull: frame the ship from its quarter at a distance that fits it.
      const h = (s.heading * Math.PI) / 180;
      const back = L * 2.2 + 30;
      offset.current.set(-Math.sin(h) * back + Math.cos(h) * L * 1.1, L * 0.4 + 10, Math.cos(h) * back + Math.sin(h) * L * 1.1);
      initialized.current = true;
      lastLength.current = L;
    }
    controls.target.copy(target.current);
    camera.position.copy(target.current).add(offset.current);
    camera.up.set(0, 1, 0);
    controls.update();
  });

  return <OrbitControls ref={orbit} enablePan={false} enableDamping dampingFactor={0.08} minDistance={15} maxDistance={1200} maxPolarAngle={Math.PI / 2 - 0.04} autoRotate={!reducedMotion} autoRotateSpeed={0.35} makeDefault />;
}
