import { describe, expect, it } from "vitest";
import { getCatalog } from "@/data";
import { createNewGame, ensureContracts, tickGame } from "@/engine/game";
import { canPerformRivalAction, isRivalAssigned, marketShare, performRivalAction, reactToEvent, rivalCanCall, rivalFeeMultiplier, rivalRelation } from "@/engine/rivals";
import { acceptContract, departShip, setDestination } from "@/engine/game";
import { applyEvent } from "@/engine/events";
import { livePrice, liveStock, marketActivity, recordTrade } from "@/engine/market";
import { buyCargo, sellCargo } from "@/engine/game";
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

  it("divert ships and take losses when an event closes a port", () => {
    const catalog = getCatalog("siraf_850");
    let state = newGame("siraf_850");
    const sack = catalog.events.find((e) => e.id === "evt_basra_sacked_871")!;
    const basra = catalog.portMap.get("port_basra")!;
    // Put a Suhar ship on its way to Basra, then let Basra fall.
    const suhar = state.rivals["rival_suhar_merchants"]!;
    const shipId = Object.keys(suhar.ships)[0]!;
    const ship = suhar.ships[shipId]!;
    const bound = { ...ship, status: "sailing" as const, docked_port_id: null, origin_port_id: "port_suhar", destination_port_id: "port_basra", route: [{ lat: ship.position.lat, lon: ship.position.lon }, { lat: basra.latitude, lon: basra.longitude, port_id: "port_basra" }], waypoint_index: 1, voyage_value: 100 };
    state = { ...state, rivals: { ...state.rivals, rival_suhar_merchants: { ...suhar, ships: { ...suhar.ships, [shipId]: bound } } } };
    const basraHouseBefore = state.rivals["rival_basra_house"]!.treasury;
    const applied = applyEvent(state, sack);
    expect(rivalCanCall(catalog.scenario.rivals.find((r) => r.id === "rival_basra_house")!, basra, applied)).toBe(false);
    const { state: after, notes } = reactToEvent(catalog, applied, sack);
    const diverted = after.rivals["rival_suhar_merchants"]!.ships[shipId]!;
    expect(diverted.destination_port_id).not.toBe("port_basra");
    expect(diverted.status).toBe("sailing");
    expect(after.rivals["rival_basra_house"]!.treasury).toBeLessThan(basraHouseBefore);
    expect(after.rivals["rival_basra_house"]!.event_log[0]?.event_id).toBe("evt_basra_sacked_871");
    expect(notes.length).toBeGreaterThanOrEqual(2);
  });

  it("cool toward the player when their own polity's relations fall", () => {
    const catalog = getCatalog("siraf_850");
    const state = newGame("siraf_850");
    const reconquest = catalog.events.find((e) => e.id === "evt_oman_reconquest_893")!;
    const { state: after } = reactToEvent(catalog, applyEvent(state, reconquest), reconquest);
    expect(after.rivals["rival_suhar_merchants"]!.relation).toBe(40);
    expect(after.rivals["rival_basra_house"]!.relation).toBe(50);
  });

  it("post charters that other carriers and the player can take", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const after = advance(newGame(), 45 * DAY);
    const posted = Object.values(after.rivals).reduce((n, r) => n + r.stats.charters_posted, 0);
    expect(posted).toBeGreaterThan(0);
    const charters = Object.values(after.contracts).filter((c) => c.charterer_id);
    for (const c of charters) {
      expect(c.charterer_id).not.toBe(c.assigned_ship_id?.split(":")[1]); // never carried by its own poster
      expect(catalog.scenario.rivals.some((r) => r.id === c.charterer_id)).toBe(true);
    }
  });

  it("let the player carry a charter, paid by the rival with goodwill attached", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let state = newGame();
    const klang = catalog.portMap.get("port_klang")!;
    const singapore = catalog.portMap.get("singapore")!;
    // Hand-post a Meridian charter at Port Klang, as the engine would at its home port.
    const good = catalog.goodMap.get(klang.supplies[0]!)!;
    const base = Object.values(state.contracts).find((c) => c.mission)!;
    const charter = { ...base, id: "ct_charter_test", mission: false, charterer_id: "rival_meridian", good_id: good.id, quantity: 100, destination_port_id: singapore.id, generation_key: null };
    state = { ...state, contracts: { ...state.contracts, [charter.id]: charter } };
    state = acceptContract(catalog, state, charter.id, "ship_1");
    state = setDestination(catalog, state, "ship_1", singapore.id);
    state = departShip(catalog, state, "ship_1");
    const before = state.rivals["rival_meridian"]!;
    const after = advance(state, 2 * DAY, 600);
    const ship = after.ships["ship_1"]!;
    expect(ship.status).toBe("docked");
    const meridian = after.rivals["rival_meridian"]!;
    expect(meridian.treasury).toBeLessThan(before.treasury);
    expect(meridian.relation).toBeGreaterThan(before.relation);
    expect(after.ledger.some((e) => e.description.includes("for Meridian Container Line"))).toBe(true);
  });

  it("form an alliance when two rivals' mutual standing is high", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let state = newGame();
    const a = state.rivals["rival_meridian"]!;
    const b = state.rivals["rival_nordhav"]!;
    state = { ...state, rivals: { ...state.rivals, rival_meridian: { ...a, relations: { rival_nordhav: 75 } }, rival_nordhav: { ...b, relations: { rival_meridian: 75 } } } };
    const r = tickGame(catalog, { ...state, paused: false }, 600);
    expect(r.state.rivals["rival_meridian"]!.allies).toContain("rival_nordhav");
    expect(r.state.rivals["rival_nordhav"]!.allies).toContain("rival_meridian");
    expect(r.events.some((e) => e.type === "rival_alliance" && e.formed)).toBe(true);
    expect(rivalRelation(r.state, "rival_meridian", "rival_nordhav")).toBeGreaterThan(70);
  });

  it("buy and sell real goods through the shared market ledger", () => {
    const after = advance(newGame(), 30 * DAY);
    const sold = Object.values(after.rivals).reduce((n, r) => n + r.stats.goods_sold, 0);
    expect(sold).toBeGreaterThan(0);
    const entries = Object.values(after.market);
    expect(entries.some((e) => (e.bought?.stock ?? 0) > 0)).toBe(true);
    expect(entries.some((e) => (e.sold?.stock ?? 0) > 0)).toBe(true);
    // Ships at sea without a contract carry goods or sail in ballast; never a leftover voyage value.
    for (const r of Object.values(after.rivals)) for (const s of Object.values(r.ships)) if (s.status === "sailing" && !s.contract_id) expect(s.voyage_value).toBe(0);
  });

  it("let rival trading move the prices and stock the player sees", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const state = newGame();
    const klang = catalog.portMap.get("port_klang")!;
    const good = catalog.goodMap.get(klang.supplies[0]!)!;
    const base = livePrice(klang, good, state);
    const stock = liveStock(klang, good, state);
    const sold = { ...state, market: recordTrade(state.market, klang.id, good.id, state.sim_seconds, "sold", Math.round(stock), base) };
    expect(livePrice(klang, good, sold)).toBeLessThan(base);
    const bought = { ...state, market: recordTrade(state.market, klang.id, good.id, state.sim_seconds, "bought", Math.round(stock / 2), base) };
    expect(livePrice(klang, good, bought)).toBeGreaterThan(base);
    expect(liveStock(klang, good, bought)).toBe(stock - Math.round(stock / 2));
  });

  it("accumulate the player's purchases and sales within a week", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let state = newGame();
    const klang = catalog.portMap.get("port_klang")!;
    const good = catalog.goodMap.get(klang.supplies[0]!)!;
    state = buyCargo(catalog, state, "ship_1", good.id, 3);
    state = buyCargo(catalog, state, "ship_1", good.id, 4);
    expect(marketActivity(state.market, klang.id, good.id, state.sim_seconds).bought).toBe(7);
    state = sellCargo(catalog, state, "ship_1", good.id, 2);
    expect(marketActivity(state.market, klang.id, good.id, state.sim_seconds).sold).toBe(2);
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
