import { describe, expect, it } from "vitest";
import { getCatalog } from "@/data";
import { initialDemographics, orderFeeMultiplier, prosperityTarget, tickDemographics, workforceSupports } from "@/engine/demographics";
import { applyEvent } from "@/engine/events";
import { createNewGame, tickGame } from "@/engine/game";
import { liveStock } from "@/engine/market";
import { parseState, serializeState } from "@/engine/save";
import type { GameState } from "@/engine/state";

const DAY = 86_400;

function newGame(scenario = "modern_shipping_2024"): GameState {
  return createNewGame({ scenario_id: scenario, empire_name: "Test Lines", difficulty: "normal", emblem: { symbol: "anchor", color: "#0ea5e9" }, rules: "historical", seed: 4242 });
}

describe("population and prosperity", () => {
  it("seed every port from its size and period", () => {
    const state = newGame("siraf_850");
    const catalog = getCatalog("siraf_850");
    for (const port of catalog.ports) {
      const ps = state.ports[port.id]!;
      expect(ps.population).toBeGreaterThan(0);
      expect(ps.prosperity).toBeGreaterThan(0);
      expect(ps).toMatchObject(initialDemographics(port, catalog.scenario.era));
    }
    // Medieval ports are far smaller than modern ones of the same class.
    const modern = newGame();
    expect(modern.ports["singapore"]!.population).toBeGreaterThan(state.ports["port_siraf"]!.population);
  });

  it("raise prosperity where ships call and lower it where a port is closed", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    const busy = { ...state, voyages: Array.from({ length: 6 }, (_, i) => ({ id: `v${i}`, ship_id: "ship_1", ship_name: "x", origin_port_id: "port_klang", destination_port_id: "singapore", departed_sim_seconds: state.sim_seconds - DAY, arrived_sim_seconds: state.sim_seconds, distance_nm: 180, revenue: 0, expenses: 0, bonuses: 0, penalties: 0, net: 0, contracts_completed: [], notes: [] })) };
    const singapore = catalog.portMap.get("singapore")!;
    expect(prosperityTarget(catalog, busy, singapore)).toBeGreaterThan(prosperityTarget(catalog, state, singapore));
    const closed = { ...state, ports: { ...state.ports, singapore: { ...state.ports["singapore"]!, access: "closed" as const } } };
    const after = tickDemographics(catalog, closed, 60);
    expect(after.ports["singapore"]!.prosperity).toBeLessThan(state.ports["singapore"]!.prosperity);
    expect(after.ports["singapore"]!.population).toBeLessThan(state.ports["singapore"]!.population);
  });

  it("shock public order when an event shuts a port", () => {
    const catalog = getCatalog("siraf_850");
    const state = newGame("siraf_850");
    const sack = catalog.events.find((e) => e.id === "evt_basra_sacked_871")!;
    const after = applyEvent(state, sack);
    expect(after.ports["port_basra"]!.order).toBe(30);
    expect(after.ports["port_basra"]!.population).toBeLessThan(state.ports["port_basra"]!.population);
    expect(orderFeeMultiplier(after.ports["port_basra"]!)).toBeGreaterThan(1);
  });

  it("feed prosperity into market stock and development rules", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    const klang = catalog.portMap.get("port_klang")!;
    const good = catalog.goodMap.get(klang.supplies[0]!)!;
    const base = liveStock(klang, good, state);
    const rich = { ...state, ports: { ...state.ports, port_klang: { ...state.ports["port_klang"]!, prosperity: 95 } } };
    const poor = { ...state, ports: { ...state.ports, port_klang: { ...state.ports["port_klang"]!, prosperity: 10 } } };
    expect(liveStock(klang, good, rich)).toBeGreaterThan(base);
    expect(liveStock(klang, good, poor)).toBeLessThan(base);
    expect(workforceSupports(poor.ports["port_klang"]!, 3)).toBe(false);
    expect(workforceSupports(poor.ports["port_klang"]!, 2)).toBe(true);
  });

  it("move daily inside the simulation and seed older saves", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    let s = { ...state, paused: false };
    for (let t = 0; t < 3 * DAY; t += 3600) s = tickGame(catalog, s, 3600).state;
    expect(s.ports["port_klang"]!.prosperity).not.toBe(state.ports["port_klang"]!.prosperity);
    const legacy = JSON.parse(serializeState(state)) as { ports: Record<string, Record<string, unknown>> };
    for (const ps of Object.values(legacy.ports)) {
      delete ps.population;
      delete ps.prosperity;
      delete ps.order;
      delete ps.rival_calls_snapshot;
    }
    const parsed = parseState(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.ports["port_klang"]!.population).toBe(0);
      const seeded = tickGame(catalog, { ...parsed.state, paused: false }, 60).state;
      expect(seeded.ports["port_klang"]!.population).toBeGreaterThan(0);
    }
  });
});
