import { describe, expect, it } from "vitest";
import { ALL_CIVILIZATIONS, ALL_EVENTS, ALL_FIGURES, ALL_GOODS, ALL_PORTS, ALL_ROUTES, ALL_SCENARIOS, ALL_SHIPS, ALL_SOURCES, ALL_TECHNOLOGIES, getCatalog, getSource } from "@/data";
import { LANE_EDGES, LANE_NODES } from "@/data/sealanes";
import { planRoute } from "@/engine/routing";
import { dateFromIso } from "@/engine/calendar";

describe("reference database integrity", () => {
  it("loads every scenario catalog", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      expect(c.ports.length).toBeGreaterThan(5);
      expect(c.ships.length).toBeGreaterThan(0);
      expect(c.goods.length).toBeGreaterThan(0);
    }
  });

  it("every cited source exists", () => {
    const check = (ids: string[], where: string) => {
      for (const id of ids) expect(getSource(id), `${where} cites missing source ${id}`).toBeDefined();
    };
    for (const r of ALL_PORTS) check(r.sources, r.id);
    for (const r of ALL_SHIPS) check(r.sources, r.id);
    for (const r of ALL_GOODS) check(r.sources, r.id);
    for (const r of ALL_TECHNOLOGIES) check(r.sources, r.id);
    for (const r of ALL_EVENTS) check(r.sources, r.id);
    for (const r of ALL_FIGURES) check(r.sources, r.id);
    for (const r of ALL_ROUTES) check(r.sources, r.id);
    for (const r of ALL_CIVILIZATIONS) check(r.historical_sources, r.id);
    for (const r of ALL_SCENARIOS) check(r.sources, r.id);
    expect(ALL_SOURCES.length).toBeGreaterThan(20);
  });

  it("every port references existing lane nodes", () => {
    const nodeIds = new Set(LANE_NODES.map((n) => n.id));
    for (const p of ALL_PORTS) {
      expect(p.lane_nodes.length).toBeGreaterThan(0);
      for (const n of p.lane_nodes) expect(nodeIds.has(n), `${p.id} -> ${n}`).toBe(true);
    }
    for (const [a, b] of LANE_EDGES) {
      expect(nodeIds.has(a)).toBe(true);
      expect(nodeIds.has(b)).toBe(true);
    }
  });

  it("can route between every pair of ports in each scenario", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const year = dateFromIso(s.start_date).year;
      for (const a of c.ports) {
        for (const b of c.ports) {
          if (a.id === b.id) continue;
          const route = planRoute(a, b, year);
          expect(route, `${s.id}: no route ${a.id} -> ${b.id}`).not.toBeNull();
          expect(route!.distance_nm).toBeGreaterThan(0);
        }
      }
    }
  });

  it("does not use canals before they existed", () => {
    const c = getCatalog("siraf_850");
    const aden = c.portMap.get("port_aden")!;
    const basra = c.portMap.get("port_basra")!;
    const route = planRoute(aden, basra, 850)!;
    expect(route.via).not.toContain("gulf_of_suez");
    const modern = getCatalog("modern_shipping_2024");
    const rotterdam = modern.portMap.get("rotterdam")!;
    const jebel = modern.portMap.get("jebel_ali")!;
    const modernRoute = planRoute(jebel, rotterdam, 2024)!;
    expect(modernRoute.via).toContain("gulf_of_suez");
    expect(modernRoute.distance_nm).toBeLessThan(7500);
  });

  it("modern coordinates are plausible for the named ports", () => {
    const klang = ALL_PORTS.find((p) => p.id === "port_klang")!;
    expect(klang.latitude).toBeCloseTo(3.0, 0);
    expect(klang.longitude).toBeCloseTo(101.4, 0);
    const singapore = ALL_PORTS.find((p) => p.id === "singapore")!;
    expect(singapore.latitude).toBeCloseTo(1.3, 0);
    expect(singapore.longitude).toBeCloseTo(103.8, 0);
  });
});

describe("historical scenario validation", () => {
  it("scenario dates fall within the active periods of their ports", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const start = dateFromIso(s.start_date).year;
      const end = dateFromIso(s.end_date).year;
      expect(end).toBeGreaterThan(start);
      for (const p of c.ports) {
        expect(p.active_period.start, `${p.id} not yet active in ${s.id}`).toBeLessThanOrEqual(start);
        if (p.active_period.end !== null) expect(p.active_period.end, `${p.id} ended before ${s.id}`).toBeGreaterThanOrEqual(start);
      }
    }
  });

  it("ships and goods belong to the scenario period", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const start = dateFromIso(s.start_date).year;
      for (const ship of c.ships) {
        if (ship.earliest_documented_period !== null) expect(ship.earliest_documented_period, `${ship.id} in ${s.id}`).toBeLessThanOrEqual(start + 60);
        if (ship.latest_documented_period !== null) expect(ship.latest_documented_period, `${ship.id} in ${s.id}`).toBeGreaterThanOrEqual(start);
        if (s.mode === "modern") expect(ship.propulsion).toBe("engine");
        else expect(ship.propulsion).toBe("sail");
      }
      for (const good of c.goods) {
        if (good.historical_availability) {
          expect(good.historical_availability.start, `${good.id} in ${s.id}`).toBeLessThanOrEqual(start);
          if (good.historical_availability.end !== null) expect(good.historical_availability.end).toBeGreaterThanOrEqual(start);
        }
      }
    }
  });

  it("historical campaigns do not share ports, ships or scenario-specific goods with each other", () => {
    const siraf = getCatalog("siraf_850");
    const melaka = getCatalog("melaka_1460");
    const sirafPorts = new Set(siraf.ports.map((p) => p.id));
    for (const p of melaka.ports) expect(sirafPorts.has(p.id)).toBe(false);
    const sirafShips = new Set(siraf.ships.map((s) => s.id));
    for (const s of melaka.ships) expect(sirafShips.has(s.id)).toBe(false);
    const shared = melaka.goods.filter((g) => siraf.goodMap.has(g.id)).length;
    expect(shared).toBeLessThan(melaka.goods.length / 2);
  });

  it("every event with effects has a trigger date inside its scenario window", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const start = dateFromIso(s.start_date);
      const end = dateFromIso(s.end_date);
      for (const e of c.events) {
        if (e.effects.length > 0 && e.trigger_date) {
          const d = dateFromIso(e.trigger_date);
          expect(d.year).toBeGreaterThanOrEqual(start.year);
          expect(d.year).toBeLessThanOrEqual(end.year);
        }
      }
    }
  });

  it("technology prerequisites exist within the same scenario", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const ids = new Set(c.technologies.map((t) => t.id));
      for (const t of c.technologies) for (const p of t.prerequisites) expect(ids.has(p), `${t.id} -> ${p}`).toBe(true);
    }
  });
});
