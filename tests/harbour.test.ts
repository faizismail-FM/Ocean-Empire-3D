import { describe, expect, it } from "vitest";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import type { PortRecord } from "@/data/schemas";
import { LANE_NODES } from "@/data/sealanes";
import { distanceNm, headingDifference, initialBearing } from "@/engine/geo";
import {
  AGROUND_CLEAR_M,
  berthHeading,
  FAIRWAY_DISTANCE_NM,
  fairwayWaypoint,
  fromHarbourLocal,
  GROUNDING_MARGIN_M,
  harbourClearance,
  harbourLayout,
  inApproachCorridor,
  landBearing,
  legClearsHarbour,
  nearestHarbour,
  pushOut,
  seaBearing,
  sweepGrounding,
  toHarbourLocal,
} from "@/engine/harbour";

const modern = getCatalog("modern_shipping_2024");
const singapore = modern.portMap.get("singapore")!; // one lane node
const klang = modern.portMap.get("port_klang")!; // two lane nodes far apart
const nodes = new Map(LANE_NODES.map((n) => [n.id, n]));

describe("harbour orientation", () => {
  it("faces a single-node port toward its lane node", () => {
    const node = nodes.get(singapore.lane_nodes[0]!)!;
    expect(seaBearing(singapore)).toBeCloseTo(initialBearing({ lat: singapore.latitude, lon: singapore.longitude }, node), 5);
    expect(landBearing(singapore)).toBeCloseTo((seaBearing(singapore) + 180) % 360, 5);
  });

  it("averages the bearings of several lane nodes", () => {
    const sea = seaBearing(klang);
    const bearings = klang.lane_nodes.map((id) => initialBearing({ lat: klang.latitude, lon: klang.longitude }, nodes.get(id)!));
    // The mean lies between the two node bearings, within 90° of each.
    for (const b of bearings) expect(Math.abs(headingDifference(sea, b))).toBeLessThan(90);
    expect(sea).toBeGreaterThan(180); // Port Klang faces the Strait to the south-west
    expect(sea).toBeLessThan(270);
  });

  it("honours an explicit sea bearing and falls back without nodes", () => {
    expect(seaBearing({ ...singapore, sea_bearing: 45 })).toBe(45);
    expect(seaBearing({ ...singapore, lane_nodes: [] })).toBe(90);
  });

  it("puts the fairway waypoint straight out to sea", () => {
    const fw = fairwayWaypoint(singapore);
    const here = { lat: singapore.latitude, lon: singapore.longitude };
    expect(distanceNm(here, fw)).toBeCloseTo(FAIRWAY_DISTANCE_NM, 3);
    expect(Math.abs(headingDifference(initialBearing(here, fw), seaBearing(singapore)))).toBeLessThan(0.01);
    expect(fw.label).toBe("Singapore fairway");
    const local = toHarbourLocal(singapore, fw);
    expect(local.z).toBeLessThan(-FAIRWAY_DISTANCE_NM * 1852 * 0.99);
    expect(Math.abs(local.x)).toBeLessThan(5);
  });

  it("berths ships parallel to the quay, swinging the shorter way", () => {
    const sea = seaBearing(singapore);
    expect(Math.abs(headingDifference(berthHeading(singapore), sea))).toBeCloseTo(90, 5);
    const arriving = (landBearing(singapore) + 30) % 360; // arrived heading landward, a little to the right
    const berth = berthHeading(singapore, arriving);
    expect(Math.abs(headingDifference(berth, sea))).toBeCloseTo(90, 5);
    expect(Math.abs(headingDifference(arriving, berth))).toBeLessThanOrEqual(90);
  });

  it("round-trips the port-local frame", () => {
    for (const [x, z] of [
      [0, 0],
      [300, -2000],
      [-800, 1500],
    ] as const) {
      const geo = fromHarbourLocal(klang, x, z);
      const back = toHarbourLocal(klang, geo);
      expect(back.x).toBeCloseTo(x, 1);
      expect(back.z).toBeCloseTo(z, 1);
    }
  });
});

describe("harbour solidity", () => {
  const layout = harbourLayout("hub");

  it("is water at the berth and the fairway, solid at the quay and ashore", () => {
    expect(harbourClearance(layout, { x: 0, z: 0 })).toBeGreaterThan(GROUNDING_MARGIN_M);
    expect(harbourClearance(layout, { x: 0, z: -FAIRWAY_DISTANCE_NM * 1852 })).toBeGreaterThan(1000);
    expect(harbourClearance(layout, { x: 0, z: (layout.quayNear + layout.quayFar) / 2 })).toBeLessThan(0);
    expect(harbourClearance(layout, { x: layout.quayLength / 2 - 10, z: layout.quayNear + 10 })).toBeLessThan(0);
    expect(harbourClearance(layout, { x: 0, z: layout.landCenter })).toBeLessThan(-layout.landRadius + 1);
    expect(harbourClearance(layout, { x: layout.landRadius * 0.7, z: layout.landCenter })).toBeLessThan(0);
    // Beside the quay, off the end, it is still water.
    expect(harbourClearance(layout, { x: layout.quayLength / 2 + 300, z: 100 })).toBeGreaterThan(0);
  });

  it("pushes a point inside the shapes back to the margin", () => {
    for (const p of [
      { x: 0, z: layout.quayNear + 5 },
      { x: 100, z: layout.landCenter - layout.landRadius + 20 },
      { x: -200, z: (layout.quayNear + layout.quayFar) / 2 },
      { x: 0, z: layout.landCenter },
    ]) {
      const q = pushOut(layout, p);
      expect(harbourClearance(layout, q)).toBeGreaterThanOrEqual(GROUNDING_MARGIN_M - 0.05);
    }
    const clear = { x: 0, z: -500 };
    expect(pushOut(layout, clear)).toEqual(clear);
    // A grid over the whole harbour footprint, for every port size.
    for (const size of ["minor", "regional", "major", "hub"] as const) {
      const l = harbourLayout(size);
      for (let x = -l.landRadius - 100; x <= l.landRadius + 100; x += 97) {
        for (let z = -100; z <= l.landCenter + l.landRadius + 100; z += 83) {
          const q = pushOut(l, { x, z });
          expect(harbourClearance(l, q), `${size} (${x}, ${z}) -> (${q.x.toFixed(0)}, ${q.z.toFixed(0)})`).toBeGreaterThanOrEqual(GROUNDING_MARGIN_M - 0.05);
        }
      }
    }
  });

  it("stops a step that would tunnel through the quay at the water's edge", () => {
    const port = singapore;
    const from = fromHarbourLocal(port, 0, -400);
    const to = fromHarbourLocal(port, 0, 1200); // 1.6 km in one step, clean through quay and town
    const g = sweepGrounding([port], from, to);
    expect(g).not.toBeNull();
    expect(g!.port.id).toBe(port.id);
    const held = toHarbourLocal(port, g!.position);
    expect(held.z).toBeLessThan(harbourLayout(port.size).quayNear);
    expect(held.z).toBeGreaterThan(-400);
    expect(harbourClearance(harbourLayout(port.size), held)).toBeGreaterThanOrEqual(GROUNDING_MARGIN_M - 0.05);
  });

  it("lets a step along the waterfront pass", () => {
    const port = singapore;
    const from = fromHarbourLocal(port, -3000, -800);
    const to = fromHarbourLocal(port, 3000, -800);
    expect(sweepGrounding([port], from, to)).toBeNull();
    expect(sweepGrounding(modern.ports, { lat: 0, lon: 90 }, { lat: 0.1, lon: 90.1 })).toBeNull();
  });

  it("reports the nearest harbour and its clearance", () => {
    const near = nearestHarbour(modern.ports, fromHarbourLocal(singapore, 0, -30));
    expect(near?.port.id).toBe("singapore");
    expect(near!.clearance).toBeGreaterThan(0);
    expect(near!.clearance).toBeLessThan(AGROUND_CLEAR_M + 100);
    expect(nearestHarbour(modern.ports, { lat: 0, lon: 90 })).toBeNull();
  });

  it("recognises the approach corridor", () => {
    expect(inApproachCorridor(singapore, fromHarbourLocal(singapore, 100, -2000))).toBe(true);
    expect(inApproachCorridor(singapore, fromHarbourLocal(singapore, 2000, -2000))).toBe(false); // too far abeam
    expect(inApproachCorridor(singapore, fromHarbourLocal(singapore, 0, 200))).toBe(false); // landward of the berth line
    expect(inApproachCorridor(singapore, fromHarbourLocal(singapore, 0, -9000))).toBe(false); // beyond the fairway
  });

  it("tests route legs against the quay and the land exactly", () => {
    const port = klang;
    const l = harbourLayout(port.size);
    expect(legClearsHarbour(port, fromHarbourLocal(port, -5000, -300), fromHarbourLocal(port, 5000, -300))).toBe(true);
    expect(legClearsHarbour(port, fromHarbourLocal(port, -5000, 150), fromHarbourLocal(port, 5000, 150))).toBe(false); // through the quay
    expect(legClearsHarbour(port, fromHarbourLocal(port, -5000, l.landCenter), fromHarbourLocal(port, 5000, l.landCenter))).toBe(false); // through the land
    expect(legClearsHarbour(port, fromHarbourLocal(port, 0, 0), fairwayWaypoint(port))).toBe(true); // berth to fairway
    expect(legClearsHarbour(port, fromHarbourLocal(port, l.quayLength, -100), fromHarbourLocal(port, l.quayLength, 5000))).toBe(false); // across the shoulder of the land
  });
});

describe("harbours across the campaigns", () => {
  it("every lane node of every port lies on its sea side", () => {
    for (const s of ALL_SCENARIOS) {
      for (const p of getCatalog(s.id).ports) {
        const sea = seaBearing(p);
        for (const id of p.lane_nodes) {
          const node = nodes.get(id)!;
          const off = Math.abs(headingDifference(sea, initialBearing({ lat: p.latitude, lon: p.longitude }, node)));
          expect(off, `${s.id}: ${p.id} -> ${id} is ${off.toFixed(0)}° off the sea bearing`).toBeLessThan(90);
        }
      }
    }
  });

  it("no harbour's land reaches another port's fairway", () => {
    for (const s of ALL_SCENARIOS) {
      const ports: PortRecord[] = getCatalog(s.id).ports;
      for (const a of ports) {
        const fw = fairwayWaypoint(a);
        for (const b of ports) {
          if (a.id === b.id) continue;
          expect(harbourClearance(harbourLayout(b.size), toHarbourLocal(b, fw)), `${s.id}: ${a.id} fairway inside ${b.id}`).toBeGreaterThan(500);
        }
      }
    }
  });
});
