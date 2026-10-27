import { describe, expect, it } from "vitest";
import { getCatalog } from "@/data";
import { createNewGame, ensureContracts, tickGame } from "@/engine/game";
import { canPerformRivalAction, isRivalAssigned, marketShare, performRivalAction, rivalFeeMultiplier } from "@/engine/rivals";
import { parseState, serializeState } from "@/engine/save";
import type { GameState } from "@/engine/state";

const DAY = 86_400;

function newGame(scenario = "modern_shipping_2024"): GameState {
  return createNewGame({ scenario_id: scenario, empire_name: "Test Lines", difficulty: "normal", emblem: { symbol: "anchor", color: "#0ea5e9" }, rules: "historical", seed: 777 });
}

function advance(state: GameState, simSeconds: number, step = 1800): GameState {
  const catalog = getCatalog(state.scenario_id);
  let s = { ...state, paused: false };
  for (let t = 0; t < simSeconds; t += step) s = tickGame(catalog, s, step).state;
  return s;
}

describe("rival trading powers", () => {
  it("start every scenario with fleets at their home ports", () => {
    for (const scenario of ["modern_shipping_2024", "siraf_850", "melaka_1460"]) {
      const state = newGame(scenario);
      const catalog = getCatalog(scenario);
      expect(Object.keys(state.rivals)).toHaveLength(catalog.scenario.rivals.length);
      for (const def of catalog.scenario.rivals) {
        const rival = state.rivals[def.id]!;
        expect(Object.keys(rival.ships)).toHaveLength(def.starting_ships);
        for (const ship of Object.values(rival.ships)) expect(ship.docked_port_id).toBe(def.home_port_id);
      }
    }
  });

  it("sail, arrive and earn over a month of simulated time", () => {
    const start = newGame();
    const after = advance(start, 30 * DAY);
    const ships = Object.values(after.rivals).flatMap((r) => Object.values(r.ships));
    expect(ships.some((s) => s.total_distance_nm > 100)).toBe(true);
    const deliveries = Object.values(after.rivals).reduce((n, r) => n + r.stats.deliveries, 0);
    expect(deliveries).toBeGreaterThan(0);
    // Positions stay on the globe and ships keep valid status.
    for (const s of ships) {
      expect(Math.abs(s.position.lat)).toBeLessThanOrEqual(90);
      expect(["docked", "sailing"]).toContain(s.status);
    }
  });

  it("take contracts from the shared board at a port they call at", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let state = newGame();
    // Offer contracts at Meridian's home port, where two of its ships are berthed.
    state = ensureContracts(catalog, state, "singapore");
    const before = Object.values(state.contracts).filter((c) => c.status === "available" && c.origin_port_id === "singapore").length;
    expect(before).toBeGreaterThan(0);
    const soon = advance(state, 2 * DAY);
    // The player's tutorial contract at Port Klang is never touched (it expires on its own later).
    expect(Object.values(soon.contracts).some((c) => c.mission && c.status === "available" && !isRivalAssigned(c))).toBe(true);
    const after = advance(soon, 8 * DAY);
    const takenCount = after.rivals["rival_meridian"]!.stats.contracts_taken;
    expect(takenCount).toBeGreaterThan(0);
    // Taken contracts are marked in transit under a rival id, never as the player's own.
    for (const c of Object.values(after.contracts).filter((c) => isRivalAssigned(c))) {
      expect(c.status).toBe("in_transit");
      expect(c.mission).toBe(false);
    }
  });

  it("support courtesies and partnerships with the usual checks", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    expect(canPerformRivalAction(catalog, state, "rival_meridian", "partnership").ok).toBe(false);
    const courted = performRivalAction(catalog, state, "rival_meridian", "courtesy");
    expect(courted.rivals["rival_meridian"]!.relation).toBe(58);
    expect(courted.treasury).toBeLessThan(state.treasury);
    expect(canPerformRivalAction(catalog, courted, "rival_meridian", "courtesy").ok).toBe(false);
    const warmer = { ...courted, rivals: { ...courted.rivals, rival_meridian: { ...courted.rivals["rival_meridian"]!, relation: 65 } } };
    const partnered = performRivalAction(catalog, warmer, "rival_meridian", "partnership");
    expect(partnered.rivals["rival_meridian"]!.partnership).toBe(true);
    expect(rivalFeeMultiplier(catalog, partnered, "singapore")).toBeCloseTo(0.9);
  });

  it("report traffic share and fee pressure where a rival dominates", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    const dominated = { ...state, rivals: { ...state.rivals, rival_meridian: { ...state.rivals["rival_meridian"]!, port_calls: { singapore: 5 } } } };
    const rows = marketShare(dominated, "singapore");
    expect(rows[0]!.rival_id).toBe("rival_meridian");
    expect(rows[0]!.share).toBe(1);
    expect(rivalFeeMultiplier(catalog, dominated, "singapore")).toBeCloseTo(1.1);
  });

  it("load saves written before rivals existed", () => {
    const state = newGame();
    const legacy = JSON.parse(serializeState(state)) as Record<string, unknown>;
    delete legacy.rivals;
    const parsed = parseState(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state.rivals).toEqual({});
  });
});
