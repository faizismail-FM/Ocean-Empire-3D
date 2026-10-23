import { describe, expect, it } from "vitest";
import { destinationPoint, distanceNm, headingDifference, initialBearing, interpolate, normalizeHeading, toLocalMeters, fromLocalMeters } from "@/engine/geo";

const PORT_KLANG = { lat: 2.99, lon: 101.37 };
const SINGAPORE = { lat: 1.264, lon: 103.8 };

describe("geographic calculations", () => {
  it("computes great-circle distance (Port Klang to Singapore is roughly 180 nm)", () => {
    const d = distanceNm(PORT_KLANG, SINGAPORE);
    expect(d).toBeGreaterThan(170);
    expect(d).toBeLessThan(195);
  });

  it("is symmetric and zero for identical points", () => {
    expect(distanceNm(PORT_KLANG, SINGAPORE)).toBeCloseTo(distanceNm(SINGAPORE, PORT_KLANG), 6);
    expect(distanceNm(PORT_KLANG, PORT_KLANG)).toBe(0);
  });

  it("computes initial bearing roughly south-east from Port Klang to Singapore", () => {
    const b = initialBearing(PORT_KLANG, SINGAPORE);
    expect(b).toBeGreaterThan(120);
    expect(b).toBeLessThan(135);
  });

  it("round-trips destination point and distance", () => {
    const p = destinationPoint(PORT_KLANG, 125, 100);
    expect(distanceNm(PORT_KLANG, p)).toBeCloseTo(100, 3);
    expect(initialBearing(PORT_KLANG, p)).toBeCloseTo(125, 1);
  });

  it("interpolates along the great circle", () => {
    const mid = interpolate(PORT_KLANG, SINGAPORE, 0.5);
    expect(distanceNm(PORT_KLANG, mid)).toBeCloseTo(distanceNm(mid, SINGAPORE), 3);
    expect(interpolate(PORT_KLANG, SINGAPORE, 0)).toEqual(PORT_KLANG);
    expect(interpolate(PORT_KLANG, SINGAPORE, 1)).toEqual(SINGAPORE);
  });

  it("normalises headings and signed differences", () => {
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-10)).toBe(350);
    expect(headingDifference(350, 10)).toBe(20);
    expect(headingDifference(10, 350)).toBe(-20);
    expect(headingDifference(0, 180)).toBe(180);
  });

  it("projects to local metres and back", () => {
    const local = toLocalMeters(PORT_KLANG, SINGAPORE);
    expect(local.x).toBeGreaterThan(0); // east
    expect(local.y).toBeLessThan(0); // south
    const back = fromLocalMeters(PORT_KLANG, local.x, local.y);
    expect(back.lat).toBeCloseTo(SINGAPORE.lat, 2);
    expect(back.lon).toBeCloseTo(SINGAPORE.lon, 2);
  });
});
