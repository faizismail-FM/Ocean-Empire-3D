"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { PortRecord, Era, ShipModel } from "@/data/schemas";
import { createRandom } from "@/engine/rng";
import type { Waypoint } from "@/engine/state";
import { geoToScene, getSceneFrame } from "./scene-state";
import { waveHeight } from "./waves";
import { ProceduralShip } from "./ProceduralShip";

const PORT_VISIBLE_M = 16_000;

/**
 * A port that comes into view: a quay oriented across the approach, warehouses or cranes
 * according to the era, and a low landmass behind it. Purely visual; arrival is detected by
 * the simulation using the port's real coordinates.
 */
export function PortScenery({ port, era, approachBearing }: { port: PortRecord; era: Era; approachBearing: number }) {
  const group = useRef<THREE.Group>(null);
  const modern = era === "modern";
  const rng = useMemo(() => createRandom(`scenery:${port.id}`), [port.id]);
  const sizeFactor = { minor: 0.7, regional: 1, major: 1.3, hub: 1.6 }[port.size] ?? 1;
  const quayLength = 520 * sizeFactor;
  const buildings = useMemo(() => {
    const r = createRandom(`buildings:${port.id}`);
    return Array.from({ length: Math.round(8 * sizeFactor) }, (_, i) => ({
      x: -quayLength / 2 + (i + 0.5) * (quayLength / Math.round(8 * sizeFactor)),
      w: 30 + r.next() * 30,
      h: modern ? 10 + r.next() * 8 : 6 + r.next() * 6,
      d: 40 + r.next() * 40,
      color: modern ? r.pick(["#b8c0c8", "#9aa5b1", "#d7dde3"]) : r.pick(["#c9b38a", "#b89b70", "#d9c3a0"]),
    }));
  }, [port.id, sizeFactor, quayLength, modern]);
  const cranes = useMemo(() => (modern ? Array.from({ length: Math.round(5 * sizeFactor) }, (_, i) => -quayLength / 2 + (i + 0.5) * (quayLength / Math.round(5 * sizeFactor))) : []), [modern, sizeFactor, quayLength]);

  useFrame(() => {
    const frame = getSceneFrame();
    const g = group.current;
    if (!g) return;
    const p = geoToScene(frame.origin, { lat: port.latitude, lon: port.longitude });
    g.position.set(p.x, 0, p.z);
    // Local +z points along the approach bearing (away from the arriving ship), so the quay
    // lies across the ship's path and the land sits behind the quay.
    g.rotation.y = Math.PI - (approachBearing * Math.PI) / 180;
    const d = Math.hypot(p.x - frame.ship.x, p.z - frame.ship.z);
    g.visible = d < PORT_VISIBLE_M;
  });

  return (
    <group ref={group}>
      {/* land behind the quay (local +z is away from the arriving ship) */}
      <mesh position={[0, -6, 1250 * sizeFactor]} receiveShadow>
        <cylinderGeometry args={[1000 * sizeFactor, 1100 * sizeFactor, 16, 28]} />
        <meshStandardMaterial color={modern ? "#5f7a5a" : "#7d8f5e"} roughness={1} />
      </mesh>
      <mesh position={[0, 3, 1800 * sizeFactor]} receiveShadow>
        <cylinderGeometry args={[400 * sizeFactor, 750 * sizeFactor, 70, 20]} />
        <meshStandardMaterial color={modern ? "#4f6b4b" : "#6b7f50"} roughness={1} />
      </mesh>
      {/* quay: its face is 60 m beyond the berth position so a docked ship lies alongside */}
      <mesh position={[0, 2, 60 + 130]} castShadow receiveShadow>
        <boxGeometry args={[quayLength, 6, 260]} />
        <meshStandardMaterial color={modern ? "#8a8f94" : "#a89474"} roughness={0.95} />
      </mesh>
      {/* bollards / mooring posts */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-quayLength / 2 + (i + 0.5) * (quayLength / 10), 6, 70]}>
          <cylinderGeometry args={[0.8, 0.8, 2.5, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, 5 + b.h / 2, 260 + rng.next() * 20]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.9} />
        </mesh>
      ))}
      {cranes.map((x, i) => (
        <group key={i} position={[x, 5, 120]}>
          <mesh position={[-12, 25, 0]}>
            <boxGeometry args={[3, 50, 3]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[12, 25, 0]}>
            <boxGeometry args={[3, 50, 3]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[0, 52, -20]}>
            <boxGeometry args={[4, 3, 110]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[0, 46, 10]}>
            <boxGeometry args={[14, 8, 14]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </group>
      ))}
      {!modern && (
        <>
          <mesh position={[quayLength * 0.3, 5 + 18, 390]} castShadow>
            <cylinderGeometry args={[6, 8, 36, 8]} />
            <meshStandardMaterial color="#e3d5b8" roughness={0.9} />
          </mesh>
          <mesh position={[quayLength * 0.3, 5 + 39, 390]}>
            <coneGeometry args={[7, 8, 8]} />
            <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
          </mesh>
          <mesh position={[-quayLength * 0.35, 5 + 10, 480]} castShadow>
            <boxGeometry args={[80, 20, 60]} />
            <meshStandardMaterial color="#d9c3a0" roughness={0.9} />
          </mesh>
        </>
      )}
      {/* harbour light */}
      <mesh position={[-quayLength / 2 + 10, 14, 60]}>
        <cylinderGeometry args={[1.5, 2.5, 18, 8]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
      <pointLight position={[-quayLength / 2 + 10, 24, 60]} color="#fff3c4" intensity={400} distance={900} />
    </group>
  );
}

/** Buoy marking the next waypoint, visible within a few kilometres. */
export function WaypointBuoy({ waypoint }: { waypoint: Waypoint }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const frame = getSceneFrame();
    const g = group.current;
    if (!g) return;
    const p = geoToScene(frame.origin, waypoint);
    const d = Math.hypot(p.x - frame.ship.x, p.z - frame.ship.z);
    g.visible = d < 12_000;
    g.position.set(p.x, waveHeight(p.x, p.z, frame.wavePhases, frame.waveAmp), p.z);
    g.rotation.z = Math.sin(frame.waveClock * 1.3) * 0.08;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[2.2, 2.6, 3, 12]} />
        <meshStandardMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 6, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 9.5, 0]}>
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <pointLight position={[0, 9.5, 0]} color="#fbbf24" intensity={150} distance={400} />
      {/* beacon pillar so the marker is visible from afar */}
      <mesh position={[0, 60, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 120, 6]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/** The upcoming route legs drawn on the water, from the next waypoint onward. */
export function RouteLine({ route, fromIndex }: { route: Waypoint[]; fromIndex: number }) {
  const frame = getSceneFrame();
  const originLat = frame.origin.lat;
  const originLon = frame.origin.lon;
  const pts = useMemo(() => {
    const list: THREE.Vector3[] = [];
    for (let i = fromIndex; i < route.length; i++) {
      const wp = route[i]!;
      const p = geoToScene({ lat: originLat, lon: originLon }, wp);
      list.push(new THREE.Vector3(p.x, 1.5, p.z));
    }
    return list;
  }, [route, fromIndex, originLat, originLon]);
  if (pts.length < 2) return null;
  return <Line points={pts} color="#67e8f9" lineWidth={1.5} dashed dashSize={40} gapSize={30} transparent opacity={0.6} />;
}

/** Ambient AI traffic: a few vessels on steady courses near the player. Decorative only. */
export function TrafficShips({ era, models, seed }: { era: Era; models: ShipModel[]; seed: string }) {
  const ships = useMemo(() => {
    const r = createRandom(`traffic:${seed}`);
    const pool: ShipModel[] = models.length > 0 ? models : era === "modern" ? ["container_feeder"] : ["sewn_plank"];
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      offsetX: (r.next() - 0.5) * 9000,
      offsetZ: (r.next() - 0.5) * 9000,
      heading: r.next() * 360,
      speed: era === "modern" ? 5 + r.next() * 4 : 1.5 + r.next() * 1.5, // m/s
      length: era === "modern" ? 120 + r.next() * 180 : 15 + r.next() * 20,
      // Local traffic looks like the vessels of the scenario itself.
      model: pool[Math.floor(r.next() * pool.length)]!,
    }));
  }, [seed, era, models]);
  return (
    <>
      {ships.map((s) => (
        <TrafficShip key={s.id} {...s} />
      ))}
    </>
  );
}

function TrafficShip({ offsetX, offsetZ, heading, speed, length, model }: { offsetX: number; offsetZ: number; heading: number; speed: number; length: number; model: ShipModel }) {
  const group = useRef<THREE.Group>(null);
  const pos = useRef({ x: NaN, z: NaN });
  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const g = group.current;
    if (!g) return;
    if (Number.isNaN(pos.current.x)) {
      pos.current = { x: frame.ship.x + offsetX, z: frame.ship.z + offsetZ };
    }
    const h = (heading * Math.PI) / 180;
    const step = frame.paused ? 0 : speed * dt * Math.min(frame.timeScale, 10);
    pos.current.x += Math.sin(h) * step;
    pos.current.z -= Math.cos(h) * step;
    // Keep traffic within range by wrapping around the player.
    const dx = pos.current.x - frame.ship.x;
    const dz = pos.current.z - frame.ship.z;
    if (Math.abs(dx) > 7000) pos.current.x = frame.ship.x - Math.sign(dx) * 6500;
    if (Math.abs(dz) > 7000) pos.current.z = frame.ship.z - Math.sign(dz) * 6500;
    g.position.set(pos.current.x, waveHeight(pos.current.x, pos.current.z, frame.wavePhases, frame.waveAmp) * 0.4, pos.current.z);
    g.rotation.y = -h;
  });
  return (
    <group ref={group}>
      <ProceduralShip model={model} length={length} sailYaw={15} accent="#9ca3af" seed={`traffic-${offsetX}`} />
    </group>
  );
}
