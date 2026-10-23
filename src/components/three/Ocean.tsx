"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { WAVE_GLSL } from "./waves";
import { getSceneFrame } from "./scene-state";

const VERTEX = /* glsl */ `
${WAVE_GLSL}
#include <fog_pars_vertex>
varying vec3 vWorldPos;
varying vec3 vNormal2;
varying float vHeight;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float h = waveHeight(world.xz, uTime);
  float e = 1.2;
  float hx = waveHeight(world.xz + vec2(e, 0.0), uTime);
  float hz = waveHeight(world.xz + vec2(0.0, e), uTime);
  world.y += h;
  vWorldPos = world.xyz;
  vNormal2 = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));
  vHeight = h;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAGMENT = /* glsl */ `
#include <fog_pars_fragment>
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uAmp;
varying vec3 vWorldPos;
varying vec3 vNormal2;
varying float vHeight;
void main() {
  vec3 n = normalize(vNormal2);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(n, viewDir), 0.0);
  float fresnel = pow(1.0 - ndv, 3.5);
  float crest = clamp(vHeight / max(uAmp, 0.05) * 0.5 + 0.5, 0.0, 1.0);
  vec3 base = mix(uDeep, uShallow, crest * 0.55);
  vec3 color = mix(base, uSky * 0.85, fresnel * 0.42);
  // subsurface tint on wave backs facing the sun
  float sunFacing = max(dot(n, uSunDir), 0.0);
  color += uShallow * sunFacing * 0.08;
  // sun glitter
  vec3 halfDir = normalize(uSunDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), 260.0);
  color += uSunColor * spec * 0.9;
  float broad = pow(max(dot(n, halfDir), 0.0), 70.0);
  color += uSunColor * broad * 0.04;
  // foam on the highest crests
  float foam = smoothstep(0.86, 1.0, crest) * 0.16;
  color = mix(color, vec3(0.92, 0.96, 1.0), foam);
  gl_FragColor = vec4(color, 1.0);
  #include <fog_fragment>
}
`;

/** Procedural ocean: a large plane that follows the player ship, displaced by the shared wave model. */
export function Ocean({ segments }: { segments: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uAmp: { value: 1 },
        uDeep: { value: new THREE.Color("#0a3560") },
        uShallow: { value: new THREE.Color("#137fa8") },
        uSky: { value: new THREE.Color("#8fc6e8") },
        uSunDir: { value: new THREE.Vector3(0.3, 0.6, 0.4).normalize() },
        uSunColor: { value: new THREE.Color("#fff1d0") },
      },
    ]);
    return new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, fog: true });
  }, []);

  useFrame(() => {
    const frame = getSceneFrame();
    const m = mesh.current;
    if (!m) return;
    m.position.set(frame.ship.x, 0, frame.ship.z);
    const mat = m.material as THREE.ShaderMaterial;
    mat.uniforms.uTime!.value = frame.waveTime;
    mat.uniforms.uAmp!.value = frame.waveAmp;
    (mat.uniforms.uSunDir!.value as THREE.Vector3).copy(frame.sunDir);
    (mat.uniforms.uSky!.value as THREE.Color).copy(frame.skyColor);
    (mat.uniforms.uSunColor!.value as THREE.Color).copy(frame.sunColor);
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[9000, 9000, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
