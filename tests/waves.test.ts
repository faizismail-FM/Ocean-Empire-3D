import { describe, expect, it } from "vitest";
import { advanceWavePhases, createWavePhases, waveHeight, waveSample } from "../src/components/three/waves";

describe("wave phases", () => {
  it("keep the field continuous around an observer that jumps in scene space", () => {
    // Reference: the observer moves 1 m east in real time, with no scene jump.
    const ref = createWavePhases();
    advanceWavePhases(ref, 0.5, { x: 1, z: 0 }, { x: 1, z: 0 });
    const expected = waveHeight(1, 0, ref, 1);

    // Same real movement, but the simulation (or a floating-origin rebase) moved the
    // observer 5 km in scene coordinates: the surface under it must look the same.
    const phases = createWavePhases();
    advanceWavePhases(phases, 0.5, { x: 5000, z: -3000 }, { x: 1, z: 0 });
    expect(waveHeight(5000, -3000, phases, 1)).toBeCloseTo(expected, 4);
  });

  it("evolve in time at a stationary point", () => {
    const phases = createWavePhases();
    const before = waveHeight(10, 10, phases, 1);
    advanceWavePhases(phases, 1, { x: 0, z: 0 }, { x: 0, z: 0 });
    expect(waveHeight(10, 10, phases, 1)).not.toBeCloseTo(before, 2);
  });

  it("report slopes consistent with finite differences", () => {
    const phases = createWavePhases();
    const s = waveSample(33, -12, phases, 1.2);
    const e = 0.01;
    const fdX = (waveHeight(33 + e, -12, phases, 1.2) - waveHeight(33 - e, -12, phases, 1.2)) / (2 * e);
    const fdZ = (waveHeight(33, -12 + e, phases, 1.2) - waveHeight(33, -12 - e, phases, 1.2)) / (2 * e);
    expect(s.slopeX).toBeCloseTo(fdX, 3);
    expect(s.slopeZ).toBeCloseTo(fdZ, 3);
  });
});
