/**
 * Ocean wave model shared by the GLSL shader and the JavaScript side, so the ship, the
 * wake and the buoys ride exactly the surface the renderer draws.
 *
 * The surface is a sum of directional sine waves. The four "swell" components displace
 * the ocean mesh; the three "ripple" components are far too short to show in geometry and
 * only perturb the per-pixel normal, which is what gives the water its fine sparkle.
 *
 * Every component carries its own phase accumulator instead of a shared clock. The scene
 * advances those phases each frame (see `advanceWavePhases`), which lets the wave field
 * move past the ship at the ship's *real* speed even while the simulation runs at 60× or
 * 3600×: without that, the ship would cross several wavelengths per frame and its bobbing
 * would degrade into noise.
 */

export interface WaveParams {
  amplitude: number; // metres
  wavelength: number; // metres
  direction: [number, number]; // unit vector in the xz plane
}

/** Geometry-displacing swell: eight components spread over ~120° so the pattern never tiles. The shortest wavelength must stay well above the mesh spacing. */
export const SWELL: WaveParams[] = [
  { amplitude: 0.5, wavelength: 118, direction: [0.927, 0.375] },
  { amplitude: 0.36, wavelength: 83, direction: [0.990, -0.139] },
  { amplitude: 0.26, wavelength: 61, direction: [0.669, 0.743] },
  { amplitude: 0.19, wavelength: 44, direction: [0.866, -0.500] },
  { amplitude: 0.13, wavelength: 33, direction: [0.342, 0.940] },
  { amplitude: 0.09, wavelength: 24, direction: [0.985, 0.174] },
  { amplitude: 0.06, wavelength: 18, direction: [0.616, -0.788] },
  { amplitude: 0.04, wavelength: 13, direction: [0.809, 0.588] },
];

/** Normal-only ripples (shading detail, no displacement). */
export const RIPPLES: WaveParams[] = [
  { amplitude: 0.03, wavelength: 6.5, direction: [0.6, 0.8] },
  { amplitude: 0.02, wavelength: 3.7, direction: [-0.9, 0.436] },
  { amplitude: 0.012, wavelength: 2.1, direction: [0.2, -0.98] },
];

export const WAVES: WaveParams[] = [...SWELL, ...RIPPLES];
export const WAVE_COUNT = WAVES.length;

const G = 9.81;
const TWO_PI = Math.PI * 2;

export function waveNumber(wavelength: number): number {
  return TWO_PI / wavelength;
}

/** Angular frequency of a deep-water wave of the given length. */
export function waveSpeed(wavelength: number): number {
  return Math.sqrt(G * waveNumber(wavelength));
}

export type WavePhases = Float32Array;

export function createWavePhases(): WavePhases {
  const phases = new Float32Array(WAVE_COUNT);
  for (let i = 0; i < WAVE_COUNT; i++) phases[i] = (i * 1.7) % TWO_PI;
  return phases;
}

/**
 * Advance the phases by `dt` real seconds while the observer (the player ship) moved by
 * `sceneDelta` in scene metres but, in real time, would only have covered `realDelta`.
 * The correction keeps the pattern around the ship continuous at any time scale and also
 * across floating-origin rebases.
 */
export function advanceWavePhases(phases: WavePhases, dt: number, sceneDelta: { x: number; z: number }, realDelta: { x: number; z: number }): void {
  const dx = realDelta.x - sceneDelta.x;
  const dz = realDelta.z - sceneDelta.z;
  for (let i = 0; i < WAVE_COUNT; i++) {
    const w = WAVES[i]!;
    const k = waveNumber(w.wavelength);
    let p = phases[i]! + waveSpeed(w.wavelength) * dt + k * (w.direction[0] * dx + w.direction[1] * dz);
    p %= TWO_PI;
    if (p < 0) p += TWO_PI;
    phases[i] = p;
  }
}

/** Surface height at scene (x, z), scaled by `amp`. Swell only: ripples do not displace. */
export function waveHeight(x: number, z: number, phases: WavePhases, amp: number): number {
  let h = 0;
  for (let i = 0; i < SWELL.length; i++) {
    const w = SWELL[i]!;
    const k = waveNumber(w.wavelength);
    h += w.amplitude * Math.sin((w.direction[0] * x + w.direction[1] * z) * k + phases[i]!);
  }
  return h * amp;
}

/** Height plus analytic surface slope (dh/dx, dh/dz) for orienting floating objects. */
export function waveSample(x: number, z: number, phases: WavePhases, amp: number): { height: number; slopeX: number; slopeZ: number } {
  let h = 0;
  let sx = 0;
  let sz = 0;
  for (let i = 0; i < SWELL.length; i++) {
    const w = SWELL[i]!;
    const k = waveNumber(w.wavelength);
    const phase = (w.direction[0] * x + w.direction[1] * z) * k + phases[i]!;
    h += w.amplitude * Math.sin(phase);
    const d = w.amplitude * k * Math.cos(phase);
    sx += d * w.direction[0];
    sz += d * w.direction[1];
  }
  return { height: h * amp, slopeX: sx * amp, slopeZ: sz * amp };
}

function vec4(values: number[]): string {
  return `vec4(${values.map((v) => v.toFixed(4)).join(", ")})`;
}
function vec3(values: number[]): string {
  return `vec3(${values.map((v) => v.toFixed(4)).join(", ")})`;
}

/**
 * GLSL implementation of the same model. `waveHeight` displaces vertices (swell only);
 * `waveSlope` returns the analytic gradient of swell + ripples for per-pixel normals.
 */
export const WAVE_GLSL = /* glsl */ `
uniform vec4 uSwellPhase0;
uniform vec4 uSwellPhase1;
uniform vec3 uRipplePhase;
uniform float uAmp;
const vec4 SWELL_A0 = ${vec4(SWELL.slice(0, 4).map((w) => w.amplitude))};
const vec4 SWELL_A1 = ${vec4(SWELL.slice(4, 8).map((w) => w.amplitude))};
const vec4 SWELL_K0 = ${vec4(SWELL.slice(0, 4).map((w) => waveNumber(w.wavelength)))};
const vec4 SWELL_K1 = ${vec4(SWELL.slice(4, 8).map((w) => waveNumber(w.wavelength)))};
const vec4 SWELL_DX0 = ${vec4(SWELL.slice(0, 4).map((w) => w.direction[0]))};
const vec4 SWELL_DX1 = ${vec4(SWELL.slice(4, 8).map((w) => w.direction[0]))};
const vec4 SWELL_DZ0 = ${vec4(SWELL.slice(0, 4).map((w) => w.direction[1]))};
const vec4 SWELL_DZ1 = ${vec4(SWELL.slice(4, 8).map((w) => w.direction[1]))};
const vec3 RIP_A = ${vec3(RIPPLES.map((w) => w.amplitude))};
const vec3 RIP_K = ${vec3(RIPPLES.map((w) => waveNumber(w.wavelength)))};
const vec3 RIP_DX = ${vec3(RIPPLES.map((w) => w.direction[0]))};
const vec3 RIP_DZ = ${vec3(RIPPLES.map((w) => w.direction[1]))};

float waveHeight(vec2 p) {
  vec4 ph0 = (SWELL_DX0 * p.x + SWELL_DZ0 * p.y) * SWELL_K0 + uSwellPhase0;
  vec4 ph1 = (SWELL_DX1 * p.x + SWELL_DZ1 * p.y) * SWELL_K1 + uSwellPhase1;
  return (dot(SWELL_A0, sin(ph0)) + dot(SWELL_A1, sin(ph1))) * uAmp;
}

/* Gradient (dh/dx, dh/dz) of swell plus ripples; detail scales the ripple contribution. */
vec2 waveSlope(vec2 p, float detail) {
  vec4 ph0 = (SWELL_DX0 * p.x + SWELL_DZ0 * p.y) * SWELL_K0 + uSwellPhase0;
  vec4 ph1 = (SWELL_DX1 * p.x + SWELL_DZ1 * p.y) * SWELL_K1 + uSwellPhase1;
  vec4 d0 = SWELL_A0 * SWELL_K0 * cos(ph0);
  vec4 d1 = SWELL_A1 * SWELL_K1 * cos(ph1);
  vec2 slope = vec2(dot(d0, SWELL_DX0) + dot(d1, SWELL_DX1), dot(d0, SWELL_DZ0) + dot(d1, SWELL_DZ1));
  vec3 rphase = (RIP_DX * p.x + RIP_DZ * p.y) * RIP_K + uRipplePhase;
  vec3 rd = RIP_A * RIP_K * cos(rphase) * detail;
  slope += vec2(dot(rd, RIP_DX), dot(rd, RIP_DZ));
  return slope * uAmp;
}
`;
