import { describe, expect, it } from "vitest";
import { ALL_CIVILIZATIONS, ALL_EVENTS, ALL_EXTENTS, ALL_FIGURES, ALL_GOODS, ALL_PORTS, ALL_ROUTES, ALL_SCENARIOS, ALL_SETTLEMENTS, ALL_SHIPS, ALL_SOURCES, ALL_TECHNOLOGIES, getCatalog, getSource } from "@/data";
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
    for (const r of ALL_EXTENTS) check(r.sources, r.id);
    for (const r of ALL_SETTLEMENTS) check(r.sources, r.id);
    for (const r of ALL_SCENARIOS) for (const reg of r.regions) check(reg.sources, reg.id);
    for (const r of ALL_SCENARIOS) check(r.territory_rules.sources, `${r.id} territory rules`);
    expect(ALL_SOURCES.length).toBeGreaterThan(20);
  });

  it("dated map layers reference real scenarios and polities and carry consistent periods", () => {
    const scenarioIds = new Set(ALL_SCENARIOS.map((s) => s.id));
    const civIds = new Set(ALL_CIVILIZATIONS.map((c) => c.id));
    for (const e of [...ALL_EXTENTS, ...ALL_SETTLEMENTS]) {
      for (const id of e.scenario_ids) expect(scenarioIds.has(id), `${e.id} scenario ${id}`).toBe(true);
      if (e.polity_id) expect(civIds.has(e.polity_id), `${e.id} polity ${e.polity_id}`).toBe(true);
      if (e.period.end !== null) expect(e.period.end, `${e.id} period`).toBeGreaterThanOrEqual(e.period.start);
    }
    for (const e of ALL_EXTENTS) {
      for (const [lon, lat] of e.polygon) {
        expect(Math.abs(lon)).toBeLessThanOrEqual(180);
        expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      }
    }
    // Every historical campaign has dated control for its own polity at its start date, within its map bounds.
    for (const s of ALL_SCENARIOS.filter((x) => x.mode === "historical")) {
      const c = getCatalog(s.id);
      const year = dateFromIso(s.start_date).year;
      const own = c.extents.filter((e) => e.polity_id === s.player_polity_id && e.period.start <= year && (e.period.end === null || e.period.end >= year));
      expect(own.length, `${s.id} has no dated extent for its polity`).toBeGreaterThan(0);
      for (const e of c.extents) for (const [lon, lat] of e.polygon) {
        expect(lon, `${e.id} outside ${s.id} bounds`).toBeGreaterThanOrEqual(s.map_bounds.west - 8);
        expect(lon, `${e.id} outside ${s.id} bounds`).toBeLessThanOrEqual(s.map_bounds.east + 8);
        expect(lat, `${e.id} outside ${s.id} bounds`).toBeGreaterThanOrEqual(s.map_bounds.south - 8);
        expect(lat, `${e.id} outside ${s.id} bounds`).toBeLessThanOrEqual(s.map_bounds.north + 8);
      }
    }
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
    const campaigns = ALL_SCENARIOS.filter((s) => s.mode === "historical").map((s) => getCatalog(s.id));
    expect(campaigns.length).toBeGreaterThanOrEqual(4);
    for (const a of campaigns) {
      for (const b of campaigns) {
        if (a === b) continue;
        const aPorts = new Set(a.ports.map((p) => p.id));
        for (const p of b.ports) expect(aPorts.has(p.id), `${p.id} shared by ${a.scenario.id} and ${b.scenario.id}`).toBe(false);
        const aShips = new Set(a.ships.map((s) => s.id));
        for (const s of b.ships) expect(aShips.has(s.id), `${s.id} shared by ${a.scenario.id} and ${b.scenario.id}`).toBe(false);
        const shared = b.goods.filter((g) => a.goodMap.has(g.id)).length;
        expect(shared, `${a.scenario.id} / ${b.scenario.id} share too many goods`).toBeLessThan(b.goods.length / 2);
      }
    }
  });

  it("every scenario's rivals, starting ships, objectives and events reference records inside the scenario", () => {
    for (const s of ALL_SCENARIOS) {
      const c = getCatalog(s.id);
      const ships = new Set(c.ships.map((x) => x.id));
      const goods = new Set(c.goods.map((x) => x.id));
      const techs = new Set(c.technologies.map((x) => x.id));
      const polities = new Set(c.civilizations.map((x) => x.id));
      for (const r of s.rivals) {
        expect(c.portMap.has(r.home_port_id), `${r.id} home port`).toBe(true);
        for (const id of r.ship_class_ids) expect(ships.has(id), `${r.id} ship ${id}`).toBe(true);
        if (r.polity_id) expect(polities.has(r.polity_id), `${r.id} polity`).toBe(true);
      }
      for (const st of s.starting_ships) {
        expect(ships.has(st.class_id)).toBe(true);
        expect(c.portMap.has(st.port_id)).toBe(true);
      }
      for (const o of s.objectives) {
        const cond = o.condition;
        if ("port_id" in cond) expect(c.portMap.has(cond.port_id), `${o.id} port`).toBe(true);
        if ("good_id" in cond) expect(goods.has(cond.good_id), `${o.id} good`).toBe(true);
        if ("technology_id" in cond) expect(techs.has(cond.technology_id), `${o.id} technology`).toBe(true);
      }
      for (const e of c.events) {
        for (const f of e.effects) {
          if ("port_id" in f) expect(c.portMap.has(f.port_id), `${e.id} port ${f.port_id}`).toBe(true);
          if ("good_id" in f) expect(goods.has(f.good_id), `${e.id} good ${f.good_id}`).toBe(true);
          if ("polity_id" in f) expect(polities.has(f.polity_id), `${e.id} polity ${f.polity_id}`).toBe(true);
        }
      }
      for (const t of c.technologies) {
        for (const f of t.effects) if (f.type === "unlock_ship") expect(ships.has(f.ship_class_id), `${t.id} unlocks ${f.ship_class_id}`).toBe(true);
      }
    }
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
