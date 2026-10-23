"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getSceneFrame } from "./scene-state";
import { waveHeight } from "./waves";

const MAX_SAMPLES = 70;
const SAMPLE_INTERVAL = 0.25; // seconds of real time between samples
const WAKE_LIFETIME_SIM = 420; // simulated seconds a wake segment persists

const VERTEX = /* glsl */ `
attribute float aAge;
varying float vAge;
varying vec2 vUv2;
void main() {
  vAge = aAge;
  vUv2 = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FRAGMENT = /* glsl */ `
varying float vAge;
varying vec2 vUv2;
void main() {
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(vUv2.x * 2.0 - 1.0));
  float streak = 0.75 + 0.25 * sin(vUv2.y * 40.0 + vUv2.x * 6.0);
  float alpha = (1.0 - vAge) * (1.0 - vAge) * edge * streak * 0.55;
  gl_FragColor = vec4(0.9, 0.96, 1.0, alpha);
}
`;

/**
 * Foam trail that follows the ship's actual track (not a sprite glued to the stern):
 * positions are sampled from the ship's real movement, so turns leave a curved wake.
 */
export function Wake() {
  const mesh = useRef<THREE.Mesh>(null);
  const samples = useRef<Array<{ x: number; z: number; t: number; heading: number }>>([]);
  const lastSample = useRef(0);
  const clock = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = MAX_SAMPLES * 2;
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(verts * 2), 2));
    geo.setAttribute("aAge", new THREE.BufferAttribute(new Float32Array(verts), 1));
    const indices: number[] = [];
    for (let i = 0; i < MAX_SAMPLES - 1; i++) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    geo.setIndex(indices);
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending }), []);

  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const m = mesh.current;
    if (!m) return;
    clock.current += dt;
    const s = frame.ship;
    const list = samples.current;

    // Emit a new sample from the stern when the ship moves. Samples are stamped with
    // simulated time so the wake ages with the game clock: at high time acceleration the
    // trail simply shortens instead of stretching to the horizon.
    if (clock.current - lastSample.current > SAMPLE_INTERVAL && !frame.paused) {
      lastSample.current = clock.current;
      const h = (s.heading * Math.PI) / 180;
      const sternX = s.x - Math.sin(h) * s.length * 0.48;
      const sternZ = s.z + Math.cos(h) * s.length * 0.48;
      const last = list[list.length - 1];
      if (s.speed > 0.3 && (!last || Math.hypot(last.x - sternX, last.z - sternZ) > 0.5)) {
        list.push({ x: sternX, z: sternZ, t: frame.simSeconds, heading: s.heading });
        if (list.length > MAX_SAMPLES) list.shift();
      }
    }
    while (list.length > 0 && frame.simSeconds - list[0]!.t > WAKE_LIFETIME_SIM) list.shift();
    // A floating-origin rebase moves everything; drop samples that are implausibly far away.
    while (list.length > 0 && Math.hypot(list[0]!.x - s.x, list[0]!.z - s.z) > 20_000) list.shift();

    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
    const age = geometry.getAttribute("aAge") as THREE.BufferAttribute;
    const n = list.length;
    const baseWidth = Math.max(1.5, s.length * 0.055);
    for (let i = 0; i < n; i++) {
      const p = list[i]!;
      const a = Math.min(1, Math.max(0, (frame.simSeconds - p.t) / WAKE_LIFETIME_SIM));
      const width = baseWidth + a * s.length * 0.22 + Math.min(s.speed, 20) * 0.15;
      const h = (p.heading * Math.PI) / 180;
      // perpendicular to the heading
      const px = Math.cos(h) * width;
      const pz = Math.sin(h) * width;
      const y1 = waveHeight(p.x - px, p.z - pz, frame.waveTime, frame.waveAmp) + 0.35;
      const y2 = waveHeight(p.x + px, p.z + pz, frame.waveTime, frame.waveAmp) + 0.35;
      pos.setXYZ(i * 2, p.x - px, y1, p.z - pz);
      pos.setXYZ(i * 2 + 1, p.x + px, y2, p.z + pz);
      uv.setXY(i * 2, 0, i / Math.max(1, n - 1));
      uv.setXY(i * 2 + 1, 1, i / Math.max(1, n - 1));
      age.setX(i * 2, a);
      age.setX(i * 2 + 1, a);
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    age.needsUpdate = true;
    geometry.setDrawRange(0, Math.max(0, (n - 1) * 6));
    geometry.computeBoundingSphere();
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}

/** Bow foam: a small bright patch scaled by speed. */
export function BowFoam() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const frame = getSceneFrame();
    const m = mesh.current;
    if (!m) return;
    const s = frame.ship;
    const h = (s.heading * Math.PI) / 180;
    const bx = s.x + Math.sin(h) * s.length * 0.47;
    const bz = s.z - Math.cos(h) * s.length * 0.47;
    const speedFactor = Math.min(1, s.speed / 12);
    m.position.set(bx, waveHeight(bx, bz, frame.waveTime, frame.waveAmp) + 0.4, bz);
    m.rotation.set(-Math.PI / 2, 0, -h);
    m.scale.set(Math.max(0.01, s.length * 0.12 * speedFactor), Math.max(0.01, s.length * 0.2 * speedFactor), 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * speedFactor;
  });
  return (
    <mesh ref={mesh} renderOrder={3}>
      <circleGeometry args={[1, 16]} />
      <meshBasicMaterial color="#eaf6ff" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}
