import { describe, expect, it } from "vitest";
import { type AdaptiveState, createSampler, FAST_FRAME_MS, FAST_WINDOWS_TO_STEP_UP, formatPerf, nextQuality, recordFrame, resetSampler, sampleStats, SLOW_FRAME_MS } from "@/lib/perf";

describe("frame sampler", () => {
  it("reports average, 95th percentile and frames per second over a rolling window", () => {
    const s = createSampler(10);
    for (let i = 0; i < 9; i++) recordFrame(s, 10);
    recordFrame(s, 100);
    const st = sampleStats(s);
    expect(st.avgMs).toBeCloseTo(19, 5);
    expect(st.p95Ms).toBe(100);
    expect(st.fps).toBeCloseTo(1000 / 19, 5);
    expect(st.frames).toBe(10);
    // The window rolls: ten more 10 ms frames push the slow one out.
    for (let i = 0; i < 10; i++) recordFrame(s, 10);
    expect(sampleStats(s).avgMs).toBeCloseTo(10, 5);
    expect(sampleStats(s).frames).toBe(20);
  });

  it("drops pauses and nonsense and can be reset", () => {
    const s = createSampler(4);
    recordFrame(s, 0);
    recordFrame(s, -5);
    recordFrame(s, 5000); // tab was hidden
    recordFrame(s, NaN);
    expect(sampleStats(s).fps).toBe(0);
    expect(formatPerf(sampleStats(s))).toBe("measuring…");
    recordFrame(s, 16.7);
    expect(sampleStats(s).fps).toBeGreaterThan(59);
    resetSampler(s);
    expect(sampleStats(s).fps).toBe(0);
  });
});

describe("adaptive graphics rule", () => {
  it("steps down at once when frames are slow and never below low", () => {
    let a = nextQuality({ level: "high", fastWindows: 2 }, SLOW_FRAME_MS + 1);
    expect(a).toEqual({ level: "medium", fastWindows: 0 });
    a = nextQuality(a, 50);
    expect(a.level).toBe("low");
    a = nextQuality(a, 50);
    expect(a.level).toBe("low");
  });

  it("steps up only after several consecutive fast windows and never above high", () => {
    let a: AdaptiveState = { level: "medium", fastWindows: 0 };
    for (let i = 0; i < FAST_WINDOWS_TO_STEP_UP - 1; i++) {
      a = nextQuality(a, FAST_FRAME_MS - 1);
      expect(a.level).toBe("medium");
    }
    a = nextQuality(a, FAST_FRAME_MS - 1);
    expect(a).toEqual({ level: "high", fastWindows: 0 });
    for (let i = 0; i < 10; i++) a = nextQuality(a, 5);
    expect(a.level).toBe("high");
  });

  it("an ordinary window resets the fast streak and keeps the level", () => {
    const a = nextQuality({ level: "medium", fastWindows: 2 }, 20);
    expect(a).toEqual({ level: "medium", fastWindows: 0 });
  });
});
