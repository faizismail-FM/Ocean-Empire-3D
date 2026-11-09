/**
 * Frame-time sampling and the adaptive graphics rule, shared by the sailing scene (which
 * records frames), the HUD and the settings page (which show the numbers) and the tests.
 * Pure data and pure functions; nothing here touches the renderer.
 */

export type EffectiveQuality = "low" | "medium" | "high";
export const QUALITY_ORDER: EffectiveQuality[] = ["low", "medium", "high"];

/** Frames kept for the rolling statistics (two seconds at 60 Hz). */
export const PERF_WINDOW = 120;
/** Average frame time above which "auto" steps the graphics down (30 frames per second). */
export const SLOW_FRAME_MS = 1000 / 30;
/** Average frame time below which "auto" counts a window toward stepping up (80 frames per second). */
export const FAST_FRAME_MS = 1000 / 80;
/** Consecutive fast windows needed before stepping up. */
export const FAST_WINDOWS_TO_STEP_UP = 3;
/** Seconds after a level change during which frames are ignored (shader compilation, allocation). */
export const SETTLE_SECONDS = 3;
/** Seconds between adaptive decisions. */
export const DECISION_INTERVAL_SECONDS = 2;

export interface PerfSampler {
  times: Float32Array;
  index: number;
  count: number;
  /** Frames recorded since the sampler was created. */
  frames: number;
  /** Renderer counters copied once per frame. */
  drawCalls: number;
  triangles: number;
  /** The level the scene is currently rendering at, and whether "auto" chose it. */
  level: EffectiveQuality;
  auto: boolean;
}

export interface PerfStats {
  fps: number;
  avgMs: number;
  p95Ms: number;
  frames: number;
  drawCalls: number;
  triangles: number;
  level: EffectiveQuality;
  auto: boolean;
}

export function createSampler(size = PERF_WINDOW): PerfSampler {
  return { times: new Float32Array(size), index: 0, count: 0, frames: 0, drawCalls: 0, triangles: 0, level: "medium", auto: false };
}

/** Record one rendered frame of `dtMs` milliseconds. Pauses and tab switches (very long frames) are dropped. */
export function recordFrame(s: PerfSampler, dtMs: number): void {
  if (!(dtMs > 0) || dtMs > 1000) return;
  s.times[s.index] = dtMs;
  s.index = (s.index + 1) % s.times.length;
  if (s.count < s.times.length) s.count += 1;
  s.frames += 1;
}

export function resetSampler(s: PerfSampler): void {
  s.index = 0;
  s.count = 0;
}

export function sampleStats(s: PerfSampler): PerfStats {
  if (s.count === 0) return { fps: 0, avgMs: 0, p95Ms: 0, frames: s.frames, drawCalls: s.drawCalls, triangles: s.triangles, level: s.level, auto: s.auto };
  const sorted = Array.from(s.times.subarray(0, s.count)).sort((a, b) => a - b);
  let total = 0;
  for (const t of sorted) total += t;
  const avgMs = total / sorted.length;
  const p95Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? avgMs;
  return { fps: 1000 / avgMs, avgMs, p95Ms, frames: s.frames, drawCalls: s.drawCalls, triangles: s.triangles, level: s.level, auto: s.auto };
}

export interface AdaptiveState {
  level: EffectiveQuality;
  fastWindows: number;
}

/**
 * The "auto" graphics rule, applied once per decision interval to the average frame time
 * of the last window: step down at once when the scene cannot hold 30 frames per second;
 * step up only after several consecutive windows above 80.
 */
export function nextQuality(state: AdaptiveState, avgMs: number): AdaptiveState {
  const i = QUALITY_ORDER.indexOf(state.level);
  if (avgMs > SLOW_FRAME_MS) {
    return { level: QUALITY_ORDER[Math.max(0, i - 1)] ?? "low", fastWindows: 0 };
  }
  if (avgMs < FAST_FRAME_MS) {
    const fastWindows = state.fastWindows + 1;
    if (fastWindows >= FAST_WINDOWS_TO_STEP_UP && i < QUALITY_ORDER.length - 1) {
      return { level: QUALITY_ORDER[i + 1] ?? "high", fastWindows: 0 };
    }
    return { level: state.level, fastWindows };
  }
  return { level: state.level, fastWindows: 0 };
}

/** The one sampler the sailing scene writes to; the HUD and the settings page read it. */
export const perfSampler: PerfSampler = createSampler();

export function formatPerf(stats: PerfStats): string {
  if (stats.fps === 0) return "measuring…";
  return `${Math.round(stats.fps)} fps · ${stats.avgMs.toFixed(1)} ms (p95 ${stats.p95Ms.toFixed(0)}) · ${stats.drawCalls} draws`;
}

declare global {
  interface Window {
    /** Read-only view of the sailing scene's frame statistics, for tooling and the headless perf pass. */
    __oceanEmpirePerf?: () => PerfStats;
  }
}

if (typeof window !== "undefined") {
  window.__oceanEmpirePerf = () => sampleStats(perfSampler);
}
