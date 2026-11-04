import { describe, expect, it } from "vitest";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import { DAY_CYCLE_SECONDS, clampThrottle, demoHour, demoRudder, showcaseFor } from "@/lib/menu-demo";

describe("landing page demo helpers", () => {
  it("cycles the hour between dawn and dusk without reaching night", () => {
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t <= DAY_CYCLE_SECONDS * 2; t += 1) {
      const h = demoHour(t);
      min = Math.min(min, h);
      max = Math.max(max, h);
    }
    expect(min).toBeGreaterThanOrEqual(6.5);
    expect(max).toBeLessThanOrEqual(18.5);
    expect(demoHour(0)).toBeCloseTo(9.5);
    expect(demoHour(DAY_CYCLE_SECONDS / 3)).toBeCloseTo(18.5);
    expect(demoHour((DAY_CYCLE_SECONDS * 5) / 6)).toBeCloseTo(6.5);
    expect(demoHour(DAY_CYCLE_SECONDS)).toBeCloseTo(9.5);
  });

  it("keeps the autopilot's meander within a gentle rudder band", () => {
    for (let t = 0; t < 2000; t += 0.5) {
      const r = demoRudder(t);
      expect(Math.abs(r)).toBeLessThanOrEqual(0.3);
    }
    expect(demoRudder(0)).not.toBe(demoRudder(40));
  });

  it("picks each scenario's starting vessel with a livery colour and a wind", () => {
    for (const s of ALL_SCENARIOS) {
      const show = showcaseFor(s, getCatalog(s.id));
      expect(show.cls.id).toBe(s.starting_ships[0]!.class_id);
      expect(show.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(show.wind.speed_knots).toBeGreaterThanOrEqual(0);
      expect(show.shipName.length).toBeGreaterThan(0);
      if (s.mode === "modern") expect(show.cls.propulsion).toBe("engine");
      else expect(show.cls.propulsion).toBe("sail");
    }
  });

  it("clamps the demo throttle to a sailing range in twentieths", () => {
    expect(clampThrottle(2)).toBe(1);
    expect(clampThrottle(0)).toBe(0.15);
    expect(clampThrottle(0.52)).toBe(0.5);
  });
});
