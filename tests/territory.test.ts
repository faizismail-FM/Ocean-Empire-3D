import { describe, expect, it } from "vitest";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import { createNewGame, performTerritory, tickGame, TransactionError } from "@/engine/game";
import { evaluateCondition } from "@/engine/objectives";
import { canDevelop, dailyAdministrationIncome, portFee } from "@/engine/portdev";
import { parseState, serializeState } from "@/engine/save";
import type { GameState, VoyageRecord } from "@/engine/state";
import { canAcquireDependency, canFoundSettlement, holdingsCount, influenceTarget, regionSummaries, territoryUpkeep, tickInfluence } from "@/engine/territory";

const DAY = 86_400;

function newGame(scenario = "kilwa_1330"): GameState {
  return createNewGame({ scenario_id: scenario, empire_name: "Test", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 5 });
}

/** Record `n` player calls at a port without sailing there. */
function withCalls(state: GameState, portId: string, n: number): GameState {
  const voyages: VoyageRecord[] = [...state.voyages];
  for (let i = 0; i < n; i++) {
    const ship = Object.values(state.ships)[0]!;
    voyages.push({ id: `v${portId}${i}`, ship_id: ship.id, ship_name: ship.name, origin_port_id: state.empire.home_port_id, destination_port_id: portId, departed_sim_seconds: state.sim_seconds - DAY, arrived_sim_seconds: state.sim_seconds, distance_nm: 100, revenue: 0, expenses: 0, bonuses: 0, penalties: 0, net: 0, contracts_completed: [], notes: [] });
  }
  return { ...state, voyages, ports: { ...state.ports, [portId]: { ...state.ports[portId]!, visited: true } } };
}

describe("regions and rules", () => {
  it("every historical scenario groups each of its ports into exactly one region", () => {
    for (const s of ALL_SCENARIOS.filter((x) => x.mode === "historical")) {
      const c = getCatalog(s.id);
      const seen = new Map<string, number>();
      for (const r of s.regions) for (const id of r.port_ids) {
        expect(c.portMap.has(id), `${s.id}: region ${r.id} names unknown port ${id}`).toBe(true);
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
      for (const p of c.ports) expect(seen.get(p.id), `${s.id}: ${p.id} not in a region`).toBe(1);
      expect(s.territory_rules.settlements).toBe(true);
    }
    const modern = ALL_SCENARIOS.find((x) => x.mode === "modern")!;
    expect(modern.regions).toEqual([]);
    expect(modern.territory_rules.settlements).toBe(false);
  });

  it("summarises influence per region", () => {
    const catalog = getCatalog("kilwa_1330");
    const state = newGame();
    const summaries = regionSummaries(catalog, state);
    expect(summaries.map((r) => r.region.id)).toEqual(catalog.scenario.regions.map((r) => r.id));
    const south = summaries.find((r) => r.region.id === "reg_kilwa_south")!;
    expect(south.ports.map((p) => p.port.id)).toContain("port_kilwa");
    expect(south.influence).toBeGreaterThan(summaries.find((r) => r.region.id === "reg_kilwa_india")!.influence);
  });
});

describe("influence", () => {
  it("is total at home, follows calls and facilities elsewhere, and relaxes daily toward its target", () => {
    const catalog = getCatalog("kilwa_1330");
    let state = newGame();
    expect(influenceTarget(state, "port_kilwa")).toBe(100);
    expect(influenceTarget(state, "port_mombasa_1330")).toBe(0);
    state = withCalls(state, "port_mombasa_1330", 4);
    const target = influenceTarget(state, "port_mombasa_1330");
    expect(target).toBe(55); // visited 10 + full share 45
    const before = state.ports.port_mombasa_1330!.influence;
    const after = tickInfluence(state, 30).ports.port_mombasa_1330!.influence;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(target);
    // Ports never visited drift down toward nothing.
    expect(tickInfluence(state, 60).ports.port_cambay_1330!.influence).toBeLessThan(10);
    void catalog;
  });
});

describe("settlements and dependencies", () => {
  it("refuses a settlement until the house is known at the port, then grants building rights and lower fees", () => {
    const catalog = getCatalog("kilwa_1330");
    let state = newGame();
    expect(canFoundSettlement(catalog, state, "port_mombasa_1330").ok).toBe(false);
    expect(() => performTerritory(catalog, state, "port_mombasa_1330", "settlement")).toThrow(TransactionError);
    state = withCalls(state, "port_mombasa_1330", 4);
    state = { ...state, ports: { ...state.ports, port_mombasa_1330: { ...state.ports.port_mombasa_1330!, influence: 30 } } };
    const check = canFoundSettlement(catalog, state, "port_mombasa_1330");
    expect(check.ok).toBe(true);
    const feeBefore = portFee(catalog, state, "port_mombasa_1330", 100, 1);
    expect(canDevelop(catalog, state, "port_mombasa_1330", "warehouse").ok).toBe(false);

    const next = performTerritory(catalog, state, "port_mombasa_1330", "settlement");
    expect(next.treasury).toBe(state.treasury - check.cost);
    expect(next.ports.port_mombasa_1330!.holding).toBe("settlement");
    expect(next.ports.port_mombasa_1330!.access).toBe("agreement");
    expect(portFee(catalog, next, "port_mombasa_1330", 100, 1)).toBeLessThan(feeBefore);
    expect(canDevelop(catalog, next, "port_mombasa_1330", "warehouse").ok).toBe(true);
    expect(holdingsCount(next)).toEqual({ settlements: 1, dependencies: 0 });
    expect(evaluateCondition(next, { type: "settlements_founded", count: 1 }).complete).toBe(true);
    expect(territoryUpkeep(catalog, next)).toBeGreaterThan(0);
    expect(next.ledger.at(-1)?.category).toBe("territory");
  });

  it("allows a dependency only where the rules permit, with influence, traffic and favour", () => {
    const kilwa = getCatalog("kilwa_1330");
    let state = newGame();
    state = withCalls(state, "port_sofala", 5);
    state = { ...state, ports: { ...state.ports, port_sofala: { ...state.ports.port_sofala!, influence: 30 } } };
    state = performTerritory(kilwa, state, "port_sofala", "settlement");
    expect(canAcquireDependency(kilwa, state, "port_sofala").ok).toBe(false); // influence still below 70
    state = { ...state, ports: { ...state.ports, port_sofala: { ...state.ports.port_sofala!, influence: 75 } } };
    const check = canAcquireDependency(kilwa, state, "port_sofala");
    expect(check.ok).toBe(true);
    const next = performTerritory(kilwa, state, "port_sofala", "dependency");
    expect(next.ports.port_sofala!.holding).toBe("dependency");
    expect(evaluateCondition(next, { type: "dependencies_held", count: 1 }).complete).toBe(true);
    // A dependency's customs house pays the house at half the home rate.
    const withAdmin = { ...next, ports: { ...next.ports, port_sofala: { ...next.ports.port_sofala!, infrastructure: { administration: 2 } } } };
    expect(dailyAdministrationIncome(kilwa, withAdmin)).toBeGreaterThan(dailyAdministrationIncome(kilwa, next));
    // Great cities are never available.
    expect(canAcquireDependency(kilwa, { ...state, ports: { ...state.ports, port_aden_1330: { ...state.ports.port_aden_1330!, holding: "settlement", influence: 90 } } }, "port_aden_1330").reason).toMatch(/great a city/);

    // Siraf's rules forbid dependencies outright.
    const siraf = getCatalog("siraf_850");
    let s2 = newGame("siraf_850");
    s2 = { ...s2, ports: { ...s2.ports, port_kollam: { ...s2.ports.port_kollam!, holding: "settlement", influence: 90, visited: true } } };
    expect(canAcquireDependency(siraf, s2, "port_kollam").ok).toBe(false);
    expect(canAcquireDependency(siraf, s2, "port_kollam").reason).toBe(siraf.scenario.territory_rules.dependency_note);
  });

  it("charges upkeep daily and the modern scenario has no territory actions", () => {
    const catalog = getCatalog("kilwa_1330");
    let state = newGame();
    state = withCalls(state, "port_mombasa_1330", 4);
    state = { ...state, ports: { ...state.ports, port_mombasa_1330: { ...state.ports.port_mombasa_1330!, influence: 30 } } };
    state = performTerritory(catalog, state, "port_mombasa_1330", "settlement");
    let s = { ...state, paused: false };
    for (let t = 0; t < 3 * DAY; t += DAY) s = tickGame(catalog, s, DAY).state;
    expect(s.ledger.some((e) => e.category === "territory" && e.amount < 0 && e.description.startsWith("Settlements"))).toBe(true);

    const modern = getCatalog("modern_shipping_2024");
    const m = newGame("modern_shipping_2024");
    expect(canFoundSettlement(modern, m, "singapore").ok).toBe(false);
  });

  it("round-trips holdings through the save format and defaults older saves", () => {
    const catalog = getCatalog("kilwa_1330");
    let state = newGame();
    state = withCalls(state, "port_mombasa_1330", 4);
    state = { ...state, ports: { ...state.ports, port_mombasa_1330: { ...state.ports.port_mombasa_1330!, influence: 30 } } };
    state = performTerritory(catalog, state, "port_mombasa_1330", "settlement");
    const restored = parseState(serializeState(state));
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(restored.state.ports.port_mombasa_1330!.holding).toBe("settlement");
    const legacy = JSON.parse(serializeState(newGame())) as { ports: Record<string, Record<string, unknown>> };
    for (const p of Object.values(legacy.ports)) {
      delete p.holding;
      delete p.holding_since;
    }
    const parsed = parseState(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state.ports.port_kilwa!.holding).toBe("none");
  });
});
