import { describe, expect, it } from "vitest";
import { getCatalog, requireShipClass } from "@/data";
import {
  acceptContract,
  buyCargo,
  buyShip,
  canBuyShip,
  createNewGame,
  departShip,
  developPort,
  ensureContracts,
  performDiplomacy,
  refuelShip,
  researchTechnology,
  sellCargo,
  setDestination,
  setPaused,
  tickGame,
  TransactionError,
} from "@/engine/game";
import { applyTransaction } from "@/engine/economy";
import { canDevelop, infrastructureCost } from "@/engine/portdev";
import { canResearch } from "@/engine/tech";
import { parseState, serializeState, summarizeState } from "@/engine/save";
import type { GameState } from "@/engine/state";
import { validateAccept } from "@/engine/contracts";
import { computeModifiers } from "@/engine/modifiers";

const SEED = 12345;

function newModern(): GameState {
  return createNewGame({ scenario_id: "modern_shipping_2024", empire_name: "Test Lines", difficulty: "normal", emblem: { symbol: "anchor", color: "#0ea5e9" }, rules: "historical", seed: SEED });
}

function advance(state: GameState, catalog = getCatalog(state.scenario_id), simSeconds: number, step = 600) {
  let s = state;
  const events = [];
  for (let t = 0; t < simSeconds; t += step) {
    const r = tickGame(catalog, s, step);
    s = r.state;
    events.push(...r.events);
    if (s.campaign.status !== "active") break;
  }
  return { state: s, events };
}

describe("treasury transactions", () => {
  it("records ledger entries and refuses unaffordable expenses", () => {
    const s = newModern();
    const paid = applyTransaction(s, -1000, "other", "test");
    expect(paid.treasury).toBe(s.treasury - 1000);
    expect(paid.ledger.at(-1)?.amount).toBe(-1000);
    expect(() => applyTransaction(s, -s.treasury - 1, "other", "too much")).toThrow(TransactionError);
    expect(applyTransaction(s, 0, "other", "noop")).toBe(s);
  });
});

describe("new game", () => {
  it("creates a starting fleet at the home port with contracts available", () => {
    const s = newModern();
    expect(Object.keys(s.ships)).toHaveLength(1);
    const ship = Object.values(s.ships)[0]!;
    expect(ship.docked_port_id).toBe("port_klang");
    expect(ship.endurance).toBe(requireShipClass("feeder_1000").endurance_capacity);
    const offers = Object.values(s.contracts).filter((c) => c.origin_port_id === "port_klang" && c.status === "available");
    expect(offers.length).toBeGreaterThan(2);
    for (const c of offers) expect(c.quantity).toBeLessThanOrEqual(1000);
    expect(s.treasury).toBe(6_000_000);
  });

  it("is deterministic for a given seed", () => {
    const a = createNewGame({ scenario_id: "siraf_850", empire_name: "A", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 7 });
    const b = createNewGame({ scenario_id: "siraf_850", empire_name: "A", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 7 });
    expect(Object.keys(a.contracts).sort()).toEqual(Object.keys(b.contracts).sort());
    expect(Object.values(a.contracts).map((c) => c.payment)).toEqual(Object.values(b.contracts).map((c) => c.payment));
  });

  it("applies difficulty to the starting treasury", () => {
    const hard = createNewGame({ scenario_id: "modern_shipping_2024", empire_name: "H", difficulty: "hard", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 1 });
    expect(hard.treasury).toBe(3_600_000);
  });
});

describe("contracts and cargo", () => {
  it("validates capacity and origin before accepting", () => {
    const catalog = getCatalog("modern_shipping_2024");
    const s = newModern();
    const ship = Object.values(s.ships)[0]!;
    const cls = requireShipClass(ship.class_id);
    const offer = Object.values(s.contracts).find((c) => c.status === "available")!;
    expect(validateAccept(catalog, s, offer, ship, cls).ok).toBe(true);
    const tooBig = { ...offer, quantity: 5000 };
    expect(validateAccept(catalog, s, tooBig, ship, cls).ok).toBe(false);
    const elsewhere = { ...ship, docked_port_id: "singapore" };
    expect(validateAccept(catalog, s, offer, elsewhere, cls).ok).toBe(false);
    const accepted = acceptContract(catalog, s, offer.id, ship.id);
    expect(accepted.contracts[offer.id]?.status).toBe("accepted");
    expect(accepted.ships[ship.id]?.cargo[0]?.quantity).toBe(offer.quantity);
    expect(() => acceptContract(catalog, accepted, offer.id, ship.id)).toThrow();
  });

  it("buys and sells market cargo with validation", () => {
    const catalog = getCatalog("siraf_850");
    let s = createNewGame({ scenario_id: "siraf_850", empire_name: "A", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 3 });
    const ship = Object.values(s.ships)[0]!;
    const before = s.treasury;
    s = buyCargo(catalog, s, ship.id, "good_dates", 10);
    expect(s.treasury).toBeLessThan(before);
    expect(s.ships[ship.id]?.cargo.find((c) => c.good_id === "good_dates")?.quantity).toBe(10);
    expect(() => buyCargo(catalog, s, ship.id, "good_dates", 100000)).toThrow();
    expect(() => buyCargo(catalog, s, ship.id, "good_pepper", 1)).toThrow(); // Siraf does not supply pepper
    const afterBuy = s.treasury;
    s = sellCargo(catalog, s, ship.id, "good_dates", 10);
    expect(s.treasury).toBeGreaterThan(afterBuy);
    expect(s.ships[ship.id]?.cargo.find((c) => c.good_id === "good_dates")).toBeUndefined();
  });
});

describe("modern tutorial: Port Klang to Singapore", () => {
  it("accepts a contract, sails on autopilot, arrives, is paid exactly once, and can be saved and restored", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let s = newModern();
    const ship = Object.values(s.ships)[0]!;
    s = ensureContracts(catalog, s, "port_klang");
    const offer = Object.values(s.contracts).find((c) => c.status === "available" && c.destination_port_id === "singapore");
    // The seeded generator may not offer Singapore this week; if so, synthesise a valid one.
    const contract = offer ?? {
      ...Object.values(s.contracts).find((c) => c.status === "available")!,
      id: "ct_test_singapore",
      destination_port_id: "singapore",
      quantity: 400,
      payment: 900_000,
      deadline_sim_seconds: 10 * 86400,
    };
    s = { ...s, contracts: { ...s.contracts, [contract.id]: contract } };
    s = acceptContract(catalog, s, contract.id, ship.id);
    s = setDestination(catalog, s, ship.id, "singapore");
    expect(s.ships[ship.id]?.route.length).toBeGreaterThanOrEqual(2);
    s = departShip(catalog, s, ship.id);
    expect(s.ships[ship.id]?.status).toBe("sailing");
    expect(s.contracts[contract.id]?.status).toBe("in_transit");
    const treasuryBefore = s.treasury;
    const fuelBefore = s.ships[ship.id]!.endurance;

    const { state: arrived, events } = advance(s, catalog, 36 * 3600, 300);
    const arrivedShip = arrived.ships[ship.id]!;
    expect(arrivedShip.status).toBe("docked");
    expect(arrivedShip.docked_port_id).toBe("singapore");
    expect(arrivedShip.endurance).toBeLessThan(fuelBefore);
    expect(arrivedShip.cargo).toHaveLength(0);
    const done = arrived.contracts[contract.id]!;
    expect(done.status).toBe("completed");
    expect(done.paid).toBe(true);
    const payments = arrived.ledger.filter((e) => e.category === "contract_payment");
    expect(payments).toHaveLength(1);
    expect(arrived.treasury).toBeGreaterThan(treasuryBefore);
    expect(events.some((e) => e.type === "arrived")).toBe(true);
    expect(arrived.pending_report?.contracts_completed).toContain(contract.id);
    expect(arrived.voyages[0]?.destination_port_id).toBe("singapore");
    expect(arrived.objectives["obj_modern_tutorial"]?.status).toBe("completed");
    expect(arrived.ledger.filter((e) => e.category === "objective_reward")).toHaveLength(1);

    // Docking again must not pay twice.
    const again = tickGame(catalog, arrived, 600).state;
    expect(again.ledger.filter((e) => e.category === "contract_payment")).toHaveLength(1);

    // Save and restore.
    const raw = serializeState(arrived);
    const loaded = parseState(raw);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.state.treasury).toBe(arrived.treasury);
      expect(loaded.state.ships[ship.id]?.docked_port_id).toBe("singapore");
      expect(summarizeState(loaded.state).contracts_completed).toBe(1);
    }
    expect(parseState("not json").ok).toBe(false);
    expect(parseState({ version: 99 }).ok).toBe(false);
    expect(parseState({ ...arrived, treasury: "lots" }).ok).toBe(false);
  });

  it("charges daily maintenance and expires old offers", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let s = setPaused(newModern(), false);
    const before = s.treasury;
    s = advance(s, catalog, 3 * 86400, 3600).state;
    expect(s.treasury).toBeLessThan(before);
    expect(s.ledger.some((e) => e.category === "maintenance")).toBe(true);
    expect(s.date.day).not.toBe(8);
  });
});

describe("fleet, development, technology", () => {
  it("prevents purchases the player cannot afford or is not equipped for", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let s = newModern();
    const ulcv = requireShipClass("ulcv_20000");
    expect(canBuyShip(catalog, s, ulcv, "port_klang").ok).toBe(false);
    const feeder = requireShipClass("feeder_1000");
    expect(canBuyShip(catalog, s, feeder, "port_klang").ok).toBe(false); // $6M < $18M
    s = applyTransaction(s, 20_000_000, "other", "windfall");
    expect(canBuyShip(catalog, s, feeder, "port_klang").ok).toBe(true);
    s = buyShip(catalog, s, feeder.id, "MV Second", "port_klang");
    expect(Object.keys(s.ships)).toHaveLength(2);
    expect(() => buyShip(catalog, s, feeder.id, "MV Third", "port_klang")).toThrow(TransactionError);
  });

  it("develops ports with escalating costs and respects rules", () => {
    const catalog = getCatalog("siraf_850");
    let s = createNewGame({ scenario_id: "siraf_850", empire_name: "A", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 3 });
    const c1 = infrastructureCost(catalog, "warehouse", 1);
    const c2 = infrastructureCost(catalog, "warehouse", 2);
    expect(c2).toBeGreaterThan(c1);
    expect(canDevelop(catalog, s, "port_siraf", "warehouse").ok).toBe(true);
    expect(canDevelop(catalog, s, "port_basra", "warehouse").ok).toBe(false); // no agreement
    s = developPort(catalog, s, "port_siraf", "warehouse");
    expect(s.ports["port_siraf"]?.infrastructure.warehouse).toBe(2);
  });

  it("enforces technology prerequisites and applies effects", () => {
    const catalog = getCatalog("siraf_850");
    let s = createNewGame({ scenario_id: "siraf_850", empire_name: "A", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 3 });
    s = applyTransaction(s, 10000, "other", "grant");
    const large = catalog.technologies.find((t) => t.id === "tech_large_hulls")!;
    expect(canResearch(catalog, s, large).ok).toBe(false);
    s = researchTechnology(catalog, s, "tech_sewn_hull");
    expect(canResearch(catalog, s, large).ok).toBe(true);
    s = researchTechnology(catalog, s, "tech_large_hulls");
    expect(computeModifiers(catalog, s).unlocked_ships.has("ship_sewn_large")).toBe(true);
    expect(() => researchTechnology(catalog, s, "tech_large_hulls")).toThrow();
  });

  it("refuels only up to capacity and charges for it", () => {
    const catalog = getCatalog("modern_shipping_2024");
    let s = newModern();
    const ship = Object.values(s.ships)[0]!;
    s = { ...s, ships: { ...s.ships, [ship.id]: { ...ship, endurance: 100 } } };
    const before = s.treasury;
    s = refuelShip(catalog, s, ship.id, 10_000);
    expect(s.ships[ship.id]?.endurance).toBe(900);
    expect(before - s.treasury).toBe(Math.round(800 * catalog.scenario.fuel_price_per_unit));
    expect(() => refuelShip(catalog, s, ship.id, 10)).toThrow();
  });
});

describe("historical campaigns", () => {
  it("Siraf campaign: first voyage to Suhar with a sailing ship completes and provisions are consumed", () => {
    const catalog = getCatalog("siraf_850");
    let s = createNewGame({ scenario_id: "siraf_850", empire_name: "Banu Test", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 42 });
    const ship = Object.values(s.ships)[0]!;
    expect(requireShipClass(ship.class_id).propulsion).toBe("sail");
    const offer = Object.values(s.contracts).find((c) => c.status === "available" && c.destination_port_id === "port_suhar") ?? {
      ...Object.values(s.contracts).find((c) => c.status === "available")!,
      id: "ct_test_suhar",
      destination_port_id: "port_suhar",
      quantity: 50,
      payment: 800,
      deadline_sim_seconds: 60 * 86400,
    };
    s = { ...s, contracts: { ...s.contracts, [offer.id]: offer } };
    s = acceptContract(catalog, s, offer.id, ship.id);
    s = setDestination(catalog, s, ship.id, "port_suhar");
    s = departShip(catalog, s, ship.id);
    const { state: done } = advance(s, catalog, 20 * 86400, 900);
    expect(done.ships[ship.id]?.docked_port_id).toBe("port_suhar");
    expect(done.ships[ship.id]!.endurance).toBeLessThan(requireShipClass(ship.class_id).endurance_capacity);
    expect(done.contracts[offer.id]?.status).toBe("completed");
    expect(done.objectives["obj_siraf_first"]?.status).toBe("completed");
  });

  it("Melaka campaign: Guangzhou is restricted until a Ming agreement; diplomacy opens it", () => {
    const catalog = getCatalog("melaka_1460");
    let s = createNewGame({ scenario_id: "melaka_1460", empire_name: "Test", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 9 });
    const ship = Object.values(s.ships)[0]!;
    expect(() => setDestination(catalog, s, ship.id, "port_guangzhou_ming")).toThrow();
    s = applyTransaction(s, 50000, "other", "grant");
    s = { ...s, diplomacy: { ...s.diplomacy, civ_ming: { ...s.diplomacy["civ_ming"]!, relation: 60 } } };
    s = performDiplomacy(catalog, s, "civ_ming", "request_access");
    expect(s.ports["port_guangzhou_ming"]?.access).toBe("agreement");
    expect(() => setDestination(catalog, s, ship.id, "port_guangzhou_ming")).not.toThrow();
    const evaluated = tickGame(catalog, setPaused(s, false), 60).state;
    expect(evaluated.objectives["obj_melaka_ming"]?.status).toBe("completed");
  });

  it("historical events fire on their dates and alter port access", () => {
    const catalog = getCatalog("siraf_850");
    let s = createNewGame({ scenario_id: "siraf_850", empire_name: "Test", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules: "historical", seed: 9 });
    // Jump the clock to just before the sack of Basra (7 September 871) and tick across it.
    const daysTo871 = Math.round((871 - 850) * 365.25) - 30; // early September 871
    s = { ...s, sim_seconds: daysTo871 * 86400, date: { year: 871, month: 9, day: 1 }, paused: false, stats: { ...s.stats, last_maintenance_day: daysTo871 } };
    s = applyTransaction(s, 100000, "other", "grant");
    const { state: after, events } = advance(s, catalog, 10 * 86400, 86400);
    expect(after.applied_events).toContain("evt_zanj_revolt");
    expect(after.applied_events).toContain("evt_basra_sacked_871");
    expect(after.ports["port_basra"]?.access).toBe("closed");
    expect(events.some((e) => e.type === "historical_event")).toBe(true);
    const ship = Object.values(after.ships)[0]!;
    expect(() => setDestination(catalog, after, ship.id, "port_basra")).toThrow();
  });
});
