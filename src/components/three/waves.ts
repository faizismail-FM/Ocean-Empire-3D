/**
 * Ocean wave model shared by the GLSL shader and the JavaScript side (so the ship rides
 * the same surface the renderer draws). Sum of four directional sine waves whose
 * amplitude scales with the simulated wind.
 */

export interface WaveParams {
  amplitude: number; // metres
  wavelength: number; // metres
  direction: [number, number]; // unit vector in the xz plane
  steepness: number;
}

export const WAVES: WaveParams[] = [
  { amplitude: 0.55, wavelength: 64, direction: [0.8, 0.6], steepness: 0.6 },
  { amplitude: 0.3, wavelength: 31, direction: [-0.5, 0.87], steepness: 0.5 },
  { amplitude: 0.18, wavelength: 17, direction: [0.97, -0.26], steepness: 0.4 },
  { amplitude: 0.09, wavelength: 8, direction: [-0.3, -0.95], steepness: 0.3 },
];

const G = 9.81;

export function waveSpeed(wavelength: number): number {
  const k = (2 * Math.PI) / wavelength;
  return Math.sqrt(G * k); // angular frequency
}

/** Surface height at world (x, z) and time t, scaled by `amp`. */
export function waveHeight(x: number, z: number, t: number, amp: number): number {
  let h = 0;
  for (const w of WAVES) {
    const k = (2 * Math.PI) / w.wavelength;
    const phase = (w.direction[0] * x + w.direction[1] * z) * k + waveSpeed(w.wavelength) * t;
    h += w.amplitude * Math.sin(phase);
  }
  return h * amp;
}

/** Height plus surface slope (dh/dx, dh/dz) for orienting floating objects. */
export function waveSample(x: number, z: number, t: number, amp: number): { height: number; slopeX: number; slopeZ: number } {
  const e = 1.5;
  const h = waveHeight(x, z, t, amp);
  const hx = waveHeight(x + e, z, t, amp);
  const hz = waveHeight(x, z + e, t, amp);
  return { height: h, slopeX: (hx - h) / e, slopeZ: (hz - h) / e };
}

/** GLSL implementation of the same function, injected into the ocean shader. */
export const WAVE_GLSL = `
const int WAVE_COUNT = 4;
uniform float uTime;
uniform float uAmp;
const vec4 WAVE_A = vec4(${WAVES.map((w) => w.amplitude.toFixed(3)).join(", ")});
const vec4 WAVE_L = vec4(${WAVES.map((w) => w.wavelength.toFixed(3)).join(", ")});
const vec2 WAVE_D0 = vec2(${WAVES[0]!.direction[0].toFixed(3)}, ${WAVES[0]!.direction[1].toFixed(3)});
const vec2 WAVE_D1 = vec2(${WAVES[1]!.direction[0].toFixed(3)}, ${WAVES[1]!.direction[1].toFixed(3)});
const vec2 WAVE_D2 = vec2(${WAVES[2]!.direction[0].toFixed(3)}, ${WAVES[2]!.direction[1].toFixed(3)});
const vec2 WAVE_D3 = vec2(${WAVES[3]!.direction[0].toFixed(3)}, ${WAVES[3]!.direction[1].toFixed(3)});

float waveComponent(vec2 p, float amp, float len, vec2 dir, float t) {
  float k = 6.28318530718 / len;
  float w = sqrt(9.81 * k);
  return amp * sin(dot(dir, p) * k + w * t);
}

float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += waveComponent(p, WAVE_A.x, WAVE_L.x, WAVE_D0, t);
  h += waveComponent(p, WAVE_A.y, WAVE_L.y, WAVE_D1, t);
  h += waveComponent(p, WAVE_A.z, WAVE_L.z, WAVE_D2, t);
  h += waveComponent(p, WAVE_A.w, WAVE_L.w, WAVE_D3, t);
  return h * uAmp;
}
`;
