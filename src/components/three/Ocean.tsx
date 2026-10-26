"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { WAVE_GLSL } from "./waves";
import { getSceneFrame } from "./scene-state";

/** Half-size of the finely tessellated, displaced water around the ship (metres). */
const INNER_HALF = 700;
/** Half-size of the flat outer sheet that carries the water to the fog (a multiple of INNER_HALF so its hole matches the inner sheet exactly). */
const OUTER_HALF = INNER_HALF * 17;
const OUTER_SEGMENTS = 34;

const VERTEX = /* glsl */ `
${WAVE_GLSL}
#include <fog_pars_vertex>
uniform float uDisplace;
varying vec3 vWorldPos;
varying float vHeight;
varying float vFade;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  // Displacement fades out towards the edge of the inner sheet so it meets the flat
  // outer sheet without a step.
  float r = max(abs(position.x), abs(position.y));
  float fade = uDisplace * (1.0 - smoothstep(${(INNER_HALF * 0.78).toFixed(1)}, ${INNER_HALF.toFixed(1)}, r));
  float h = waveHeight(world.xz) * fade;
  world.y += h;
  vWorldPos = world.xyz;
  vHeight = h;
  vFade = fade;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAGMENT = /* glsl */ `
${WAVE_GLSL}
#include <fog_pars_fragment>
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunStrength;
varying vec3 vWorldPos;
varying float vHeight;
varying float vFade;

void main() {
  vec3 toCam = cameraPosition - vWorldPos;
  float dist = length(toCam);
  vec3 viewDir = toCam / dist;

  // Per-pixel normal from the analytic wave gradient. Ripples fade with distance so the
  // far water does not alias into noise.
  float detail = 1.0 - smoothstep(60.0, 420.0, dist);
  vec2 slope = waveSlope(vWorldPos.xz, detail);
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));

  float ndv = max(dot(n, viewDir), 0.0);
  float fresnel = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);

  // Body colour: deep water brightening on the crests and where the sun lights the backs
  // of the waves (a cheap stand-in for subsurface scattering).
  float crest = clamp(vHeight / max(uAmp * 0.9, 0.05) * 0.5 + 0.5, 0.0, 1.0);
  float sunFacing = max(dot(n, uSunDir), 0.0);
  vec3 body = mix(uDeep, uShallow, crest * 0.3 + sunFacing * 0.08);
  body *= 0.72 + 0.28 * uSunStrength;

  // Reflection of the sky, strongest at grazing angles.
  vec3 color = mix(body, uSky, fresnel * 0.65);

  // Sun: a tight glitter term on the detailed normal plus a soft wide glow.
  vec3 halfDir = normalize(uSunDir + viewDir);
  float ndh = max(dot(n, halfDir), 0.0);
  float glitter = pow(ndh, 700.0) * 0.6;
  float glow = pow(ndh, 48.0) * 0.08;
  color += uSunColor * (glitter + glow) * uSunStrength;

  // Faint foam streaks on the highest crests only.
  float foam = smoothstep(0.84, 1.0, crest) * vFade * 0.14;
  color = mix(color, vec3(0.93, 0.97, 1.0), foam);

  gl_FragColor = vec4(color, 1.0);
  #include <fog_fragment>
}
`;

function makeUniforms() {
  return THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uSwellPhase0: { value: new THREE.Vector4() },
      uSwellPhase1: { value: new THREE.Vector4() },
      uRipplePhase: { value: new THREE.Vector3() },
      uAmp: { value: 1 },
      uDisplace: { value: 1 },
      uDeep: { value: new THREE.Color("#0b3a66") },
      uShallow: { value: new THREE.Color("#1a8fb9") },
      uSky: { value: new THREE.Color("#8fc6e8") },
      uSunDir: { value: new THREE.Vector3(0.3, 0.6, 0.4).normalize() },
      uSunColor: { value: new THREE.Color("#fff1d0") },
      uSunStrength: { value: 1 },
    },
  ]);
}

/** A square sheet with a square hole, so the flat outer water never pokes through the displaced inner sheet. */
function ringGeometry(outerHalf: number, innerHalf: number, segments: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const n = segments;
  const step = (outerHalf * 2) / n;
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      positions.push(-outerHalf + i * step, -outerHalf + j * step, 0);
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x0 = -outerHalf + i * step;
      const y0 = -outerHalf + j * step;
      const eps = step * 0.01;
      const inside = x0 >= -innerHalf - eps && x0 + step <= innerHalf + eps && y0 >= -innerHalf - eps && y0 + step <= innerHalf + eps;
      if (inside) continue;
      const a = j * (n + 1) + i;
      const b = a + 1;
      const c = a + n + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * Procedural ocean in two layers that follow the player ship: a densely tessellated,
 * wave-displaced sheet around the ship and a flat sheet out to the fog, both shaded with
 * per-pixel normals from the same wave model so the join is invisible.
 */
export function Ocean({ segments }: { segments: number }) {
  const inner = useRef<THREE.Mesh>(null);
  const outer = useRef<THREE.Mesh>(null);
  const innerMaterial = useMemo(() => new THREE.ShaderMaterial({ uniforms: makeUniforms(), vertexShader: VERTEX, fragmentShader: FRAGMENT, fog: true }), []);
  const outerMaterial = useMemo(() => {
    const m = new THREE.ShaderMaterial({ uniforms: makeUniforms(), vertexShader: VERTEX, fragmentShader: FRAGMENT, fog: true });
    m.uniforms.uDisplace!.value = 0;
    return m;
  }, []);
  const outerGeometry = useMemo(() => ringGeometry(OUTER_HALF, INNER_HALF, OUTER_SEGMENTS), []);

  useFrame(() => {
    const frame = getSceneFrame();
    const ph = frame.wavePhases;
    for (const mat of [innerMaterial, outerMaterial]) {
      (mat.uniforms.uSwellPhase0!.value as THREE.Vector4).set(ph[0]!, ph[1]!, ph[2]!, ph[3]!);
      (mat.uniforms.uSwellPhase1!.value as THREE.Vector4).set(ph[4]!, ph[5]!, ph[6]!, ph[7]!);
      (mat.uniforms.uRipplePhase!.value as THREE.Vector3).set(ph[8]!, ph[9]!, ph[10]!);
      mat.uniforms.uAmp!.value = frame.waveAmp;
      mat.uniforms.uSunStrength!.value = THREE.MathUtils.clamp((frame.sunElevation - 2) / 30, 0.25, 1);
      (mat.uniforms.uSunDir!.value as THREE.Vector3).copy(frame.sunDir);
      (mat.uniforms.uSky!.value as THREE.Color).copy(frame.skyColor);
      (mat.uniforms.uSunColor!.value as THREE.Color).copy(frame.sunColor);
    }
    // Snap the sheets to the ship so the mesh never slides under the camera; the wave
    // phases make the pattern itself continuous.
    inner.current?.position.set(frame.ship.x, 0, frame.ship.z);
    outer.current?.position.set(frame.ship.x, 0, frame.ship.z);
  });

  return (
    <>
      <mesh ref={inner} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[INNER_HALF * 2, INNER_HALF * 2, segments, segments]} />
        <primitive object={innerMaterial} attach="material" />
      </mesh>
      <mesh ref={outer} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} geometry={outerGeometry}>
        <primitive object={outerMaterial} attach="material" />
      </mesh>
    </>
  );
}
