/**
 * Generative music palettes: pure data and arithmetic, so the choice of scale, tempo and
 * timbre for a campaign can be tested without an AudioContext.
 *
 * Nothing here claims to reproduce period music. Each palette picks a scale, a register, a
 * tempo and a synthesised timbre that sit comfortably with the campaign's setting; the
 * melodies are random walks over the scale, played sparsely over a drone.
 */

export type Timbre = "pluck" | "zither" | "marimba" | "metal" | "bowed" | "harpsichord" | "pad";

export interface Palette {
  /** Scale degrees in semitones above the root; fractional values are allowed (slendro). */
  scale: number[];
  /** MIDI note of the drone root. */
  root: number;
  /** Melody register: semitones above the root for the lowest and highest melody notes. */
  range: [number, number];
  tempo_bpm: number;
  timbre: Timbre;
  /** Whether the drone adds a fifth above the root. */
  fifth: boolean;
  description: string;
}

const PALETTES: Record<string, Palette> = {
  "Abbasid-era maritime commerce": { scale: [0, 1, 4, 5, 7, 8, 10], root: 50, range: [12, 26], tempo_bpm: 72, timbre: "pluck", fifth: true, description: "A hijaz-flavoured scale on a plucked tone over a drone." },
  "Swahili coastal trading city-states": { scale: [0, 2, 4, 7, 9], root: 55, range: [7, 24], tempo_bpm: 88, timbre: "marimba", fifth: true, description: "Major pentatonic on a wooden-keyed tone." },
  "Chinese maritime civilizations": { scale: [0, 2, 4, 7, 9], root: 50, range: [12, 28], tempo_bpm: 64, timbre: "zither", fifth: false, description: "Pentatonic gong mode on a bright plucked string." },
  "Venetian maritime commerce": { scale: [0, 2, 3, 5, 7, 9, 10], root: 50, range: [12, 24], tempo_bpm: 58, timbre: "bowed", fifth: true, description: "Dorian mode on a slow bowed tone." },
  "Malacca Sultanate": { scale: [0, 2.3, 4.8, 7.1, 9.6], root: 57, range: [0, 19], tempo_bpm: 70, timbre: "metal", fifth: false, description: "A five-note slendro-like tuning on a metallic tone." },
  "Portuguese maritime expansion": { scale: [0, 2, 4, 5, 7, 9, 10], root: 55, range: [7, 24], tempo_bpm: 76, timbre: "pluck", fifth: true, description: "Mixolydian mode on a guitar-like pluck." },
  "Dutch maritime commerce": { scale: [0, 2, 3, 5, 7, 8, 10], root: 57, range: [12, 26], tempo_bpm: 82, timbre: "harpsichord", fifth: true, description: "Aeolian mode on a harpsichord-like tone." },
  "Modern shipping company": { scale: [0, 2, 4, 6, 7, 9, 11], root: 48, range: [12, 28], tempo_bpm: 54, timbre: "pad", fifth: true, description: "Lydian mode on slow synthesiser pads." },
};

const FALLBACK: Palette = { scale: [0, 2, 3, 5, 7, 9, 10], root: 50, range: [12, 24], tempo_bpm: 66, timbre: "pluck", fifth: true, description: "Dorian mode on a plucked tone." };

export function paletteFor(family: string | null | undefined): Palette {
  return (family && PALETTES[family]) || FALLBACK;
}

export function paletteFamilies(): string[] {
  return Object.keys(PALETTES);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Every scale note (as semitones above the root) inside the palette's melody range. */
export function melodyNotes(p: Palette): number[] {
  const out: number[] = [];
  for (let octave = -1; octave <= 3; octave++) {
    for (const d of p.scale) {
      const v = d + 12 * octave;
      if (v >= p.range[0] && v <= p.range[1]) out.push(v);
    }
  }
  return out.sort((a, b) => a - b);
}

/**
 * Random walk over the melody notes: mostly small steps, occasional leaps, with a pull back
 * toward the middle of the range so lines do not drift to the edges and stay there.
 */
export function nextNoteIndex(prev: number, count: number, rand: () => number): number {
  if (count <= 1) return 0;
  const r = rand();
  let step: number;
  if (r < 0.45) step = 1;
  else if (r < 0.7) step = -1;
  else if (r < 0.8) step = 2;
  else if (r < 0.88) step = -2;
  else if (r < 0.94) step = 0;
  else step = rand() < 0.5 ? 4 : -4;
  const mid = (count - 1) / 2;
  if (prev > mid + count * 0.25 && step > 0 && rand() < 0.6) step = -step;
  if (prev < mid - count * 0.25 && step < 0 && rand() < 0.6) step = -step;
  const next = prev + step;
  return Math.min(count - 1, Math.max(0, next));
}

/** Small deterministic PRNG for tests and reproducible phrases. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MusicIntensity {
  /** 0..1: how busy the melody is. */
  density: number;
  /** 0..1: overall music level before the user's volume setting. */
  level: number;
}

export type SceneMode = "off" | "menu" | "management" | "sailing";

export interface SceneInput {
  mode: SceneMode;
  docked: boolean;
  paused: boolean;
  /** Ship speed through the water in knots. */
  speedKnots: number;
  windKnots: number;
}

/** How much music a scene wants: quiet and sparse in menus and offices, fuller at sea. */
export function intensityFor(s: SceneInput): MusicIntensity {
  if (s.mode === "off") return { density: 0, level: 0 };
  if (s.mode === "menu") return { density: 0.35, level: 0.7 };
  if (s.mode === "management") return { density: 0.25, level: 0.45 };
  if (s.docked) return { density: 0.3, level: 0.6 };
  const motion = Math.min(1, s.speedKnots / 12);
  const weather = Math.min(1, s.windKnots / 30);
  const density = 0.35 + 0.35 * motion + 0.2 * weather;
  return { density: Math.min(1, density), level: s.paused ? 0.5 : 0.85 };
}
