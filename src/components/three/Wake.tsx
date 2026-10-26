"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { headingDifference } from "@/engine/geo";
import { getSceneFrame } from "./scene-state";
import { waveHeight } from "./waves";

const MAX_SAMPLES = 90;
const SAMPLE_INTERVAL = 0.2; // real seconds between samples
const WAKE_LIFETIME = 75; // real seconds a wake segment persists

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
  float x = abs(vUv2.x * 2.0 - 1.0);
  // Two bright shoulders where the hull pushes water aside, a calmer centre line.
  float shoulders = smoothstep(0.15, 0.55, x) * (1.0 - smoothstep(0.7, 1.0, x));
  float centre = (1.0 - smoothstep(0.0, 0.35, x)) * 0.45;
  // Streaks keyed to the segment age, which is continuous, rather than the strip index, which shifts whenever a sample is added or dropped.
  float streak = 0.85 + 0.15 * sin(vAge * 70.0 + x * 9.0);
  float fade = (1.0 - vAge) * (1.0 - vAge);
  // Newest segments fade in so the strip does not pop at the stern when a sample is added.
  float alpha = (shoulders + centre) * streak * fade * 0.6 * smoothstep(0.0, 0.05, vAge);
  gl_FragColor = vec4(0.92, 0.97, 1.0, alpha);
}
`;

interface WakeSample {
  /** Offset from the ship in scene metres (world-aligned, ship-centred frame). */
  x: number;
  z: number;
  born: number;
  heading: number;
}

/**
 * Foam trail that follows the ship's track. Samples are kept relative to the ship and
 * recede by the ship's real-time movement each frame, so the trail looks the same whether
 * the simulation runs at 1× or 3600×, and turns still leave a curved wake.
 */
export function Wake() {
  const mesh = useRef<THREE.Mesh>(null);
  const samples = useRef<WakeSample[]>([]);
  const lastSample = useRef(0);

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

  useFrame(() => {
    const frame = getSceneFrame();
    const m = mesh.current;
    if (!m) return;
    const s = frame.ship;
    const list = samples.current;
    const now = frame.waveClock;

    // Existing samples recede at the ship's real speed.
    if (!frame.paused) {
      for (const p of list) {
        p.x -= frame.realStep.x;
        p.z -= frame.realStep.z;
      }
    }
    while (list.length > 0 && now - list[0]!.born > WAKE_LIFETIME) list.shift();

    // Emit a new sample at the stern while the ship is making way.
    if (now - lastSample.current > SAMPLE_INTERVAL && !frame.paused && s.speed > 0.3) {
      lastSample.current = now;
      const h = (s.heading * Math.PI) / 180;
      const sternX = -Math.sin(h) * s.length * 0.48;
      const sternZ = Math.cos(h) * s.length * 0.48;
      const last = list[list.length - 1];
      // Under time acceleration a turn completes within a few samples, and the stern
      // swinging round would leave a sideways smear; start a fresh trail instead.
      if (last && Math.abs(headingDifference(s.heading, last.heading)) > 8) list.length = 0;
      if (!last || list.length === 0 || Math.hypot(last.x - sternX, last.z - sternZ) > 0.8) {
        list.push({ x: sternX, z: sternZ, born: now, heading: s.heading });
        if (list.length > MAX_SAMPLES) list.shift();
      }
    }

    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
    const age = geometry.getAttribute("aAge") as THREE.BufferAttribute;
    const n = list.length;
    const baseWidth = Math.max(1.2, s.length * 0.05);
    for (let i = 0; i < n; i++) {
      const p = list[i]!;
      const a = Math.min(1, Math.max(0, (now - p.born) / WAKE_LIFETIME));
      // The wake spreads as it ages, like a real Kelvin wake, and widens with speed.
      const width = baseWidth + a * s.length * 0.3 + Math.min(s.speed, 20) * 0.12;
      // Orient each cross-section along the local track (from its neighbours) rather than
      // the heading recorded at emission: at high time acceleration the ship can turn far
      // between two closely spaced samples, and stored headings would twist the strip.
      const prev = list[Math.max(0, i - 1)]!;
      const next = list[Math.min(n - 1, i + 1)]!;
      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const tl = Math.hypot(tx, tz);
      if (tl < 0.3) {
        const h = (p.heading * Math.PI) / 180;
        tx = -Math.sin(h);
        tz = Math.cos(h);
      } else {
        tx /= tl;
        tz /= tl;
      }
      const px = -tz * width;
      const pz = tx * width;
      const wx = s.x + p.x;
      const wz = s.z + p.z;
      const y1 = waveHeight(wx - px, wz - pz, frame.wavePhases, frame.waveAmp) + 0.3;
      const y2 = waveHeight(wx + px, wz + pz, frame.wavePhases, frame.waveAmp) + 0.3;
      pos.setXYZ(i * 2, wx - px, y1, wz - pz);
      pos.setXYZ(i * 2 + 1, wx + px, y2, wz + pz);
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

/** Bow foam: a bright patch at the stem that grows with speed and flickers slightly. */
export function BowFoam() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const frame = getSceneFrame();
    const m = mesh.current;
    if (!m) return;
    const s = frame.ship;
    const h = (s.heading * Math.PI) / 180;
    const bx = s.x + Math.sin(h) * s.length * 0.46;
    const bz = s.z - Math.cos(h) * s.length * 0.46;
    const speedFactor = Math.min(1, s.speed / 12);
    const flicker = 0.96 + 0.04 * Math.sin(frame.waveClock * 3.1);
    m.position.set(bx, waveHeight(bx, bz, frame.wavePhases, frame.waveAmp) + 0.35, bz);
    m.rotation.set(-Math.PI / 2, 0, -h);
    m.scale.set(Math.max(0.01, s.length * 0.1 * speedFactor * flicker), Math.max(0.01, s.length * 0.16 * speedFactor), 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.45 * speedFactor;
  });
  return (
    <mesh ref={mesh} renderOrder={3}>
      <circleGeometry args={[1, 16]} />
      <meshBasicMaterial color="#eaf6ff" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}
