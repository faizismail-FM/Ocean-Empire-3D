import { describe, expect, it } from "vitest";
import { ALL_SCENARIOS } from "@/data";
import { intensityFor, melodyNotes, midiToHz, mulberry32, nextNoteIndex, paletteFamilies, paletteFor } from "@/lib/audio/music";

describe("music palettes", () => {
  it("has a palette for every scenario family and a fallback for unknown ones", () => {
    for (const s of ALL_SCENARIOS) {
      expect(paletteFamilies(), `${s.id} family ${s.family}`).toContain(s.family);
      const p = paletteFor(s.family);
      expect(p.scale.length).toBeGreaterThanOrEqual(5);
      expect(p.tempo_bpm).toBeGreaterThan(40);
      expect(melodyNotes(p).length).toBeGreaterThanOrEqual(5);
    }
    expect(paletteFor("no such family").timbre).toBe("pluck");
    expect(paletteFor(null)).toBe(paletteFor(undefined));
  });

  it("tunes concert A and keeps melody notes on the scale and in range", () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(57)).toBeCloseTo(220);
    const p = paletteFor("Chinese maritime civilizations");
    for (const n of melodyNotes(p)) {
      expect(n).toBeGreaterThanOrEqual(p.range[0]);
      expect(n).toBeLessThanOrEqual(p.range[1]);
      expect(p.scale.some((d) => Math.abs(((n - d) % 12 + 12) % 12) < 1e-9)).toBe(true);
    }
  });

  it("walks the melody deterministically within bounds", () => {
    const rand = mulberry32(42);
    const count = 11;
    let idx = 5;
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      idx = nextNoteIndex(idx, count, rand);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(count);
      seen.add(idx);
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(nextNoteIndex(0, 1, rand)).toBe(0);
    const a = mulberry32(7); const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("scales music with the scene", () => {
    const base = { docked: false, paused: false, speedKnots: 0, windKnots: 0 };
    expect(intensityFor({ mode: "off", ...base }).level).toBe(0);
    expect(intensityFor({ mode: "management", ...base }).level).toBeLessThan(intensityFor({ mode: "menu", ...base }).level);
    const calm = intensityFor({ mode: "sailing", ...base, speedKnots: 2, windKnots: 5 });
    const brisk = intensityFor({ mode: "sailing", ...base, speedKnots: 10, windKnots: 25 });
    expect(brisk.density).toBeGreaterThan(calm.density);
    expect(brisk.density).toBeLessThanOrEqual(1);
    expect(intensityFor({ mode: "sailing", ...base, docked: true }).density).toBeLessThan(calm.density + 0.05);
  });
});
