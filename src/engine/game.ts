import { getCatalog, type ScenarioCatalog } from "@/data";
import type { HistoricalEvent, Objective, PortInfrastructureKind, VesselClass } from "@/data/schemas";
import { clamp, formatMoneyExact, uid } from "@/lib/utils";
import { advanceWaypoint, computeAutopilot } from "./autopilot";
import { addSeconds, dateFromIso, SECONDS_PER_DAY, type GameDate } from "./calendar";
import { buildTutorialContract, cargoCapacity, cargoUsed, generateContractsForPort, validateAccept, type ContractContext } from "./contracts";
import { applyTransaction, canAfford, TransactionError } from "./economy";
import { applyEvent, dueEvents } from "./events";
import { createRivalStates, noteCompetition, reactToEvent, rivalFeeMultiplier, tickRivals, rivalDefinition } from "./rivals";
import { distanceNm, type GeoPoint } from "./geo";
import { marketPrice, marketStock } from "./market";
import { computeModifiers, type Modifiers } from "./modifiers";
import { evaluateObjectives } from "./objectives";
import { canDevelop, dailyAdministrationIncome, portFee, repairCost } from "./portdev";
import { hashString } from "./rng";
import { planRoute, planRouteFromPosition } from "./routing";
import { stepKinematics } from "./ship";
import { SAVE_VERSION, type Contract, type GameNotification, type GameState, type ShipState, type VoyageRecord } from "./state";
import { canResearch } from "./tech";
import { windForDate } from "./wind";

/**
 * The game's rules as pure functions: (state, input) -> new state. Nothing here touches
 * React, the renderer or storage. The Zustand store is a thin wrapper around these.
 */

export type GameEvent =
  | { type: "arrived"; ship_id: string; port_id: string; report: VoyageRecord }
  | { type: "objective_completed"; objective: Objective }
  | { type: "historical_event"; event: HistoricalEvent }
  | { type: "campaign_ended"; status: GameState["campaign"]["status"] }
  | { type: "endurance_empty"; ship_id: string }
  | { type: "rival_contract_taken"; rival_id: string; contract_id: string; port_id: string }
  | { type: "rival_partnership_ended"; rival_id: string };

export interface NewGameOptions {
  scenario_id: string;
  empire_name: string;
  difficulty: "easy" | "normal" | "hard";
  emblem: { symbol: string; color: string };
  motto?: string;
  rules: "historical" | "sandbox";
  flagship_name?: string;
  seed?: number;
}

export const MAX_NOTIFICATIONS = 60;
const MAX_SUBSTEP_SECONDS = 120;
/** New games begin at 08:00 so the first voyage starts in daylight. */
export const START_CLOCK_SECONDS = 8 * 3600;

function notify(state: GameState, kind: GameNotification["kind"], title: string, message: string, link?: string): GameState {
  const n: GameNotification = { id: uid("n"), sim_seconds: state.sim_seconds, kind, title, message, read: false, link };
  const notifications = [n, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
  return { ...state, notifications };
}

export function createNewGame(options: NewGameOptions): GameState {
  const catalog = getCatalog(options.scenario_id);
  const { scenario } = catalog;
  const startDate = dateFromIso(scenario.start_date);
  const seed = options.seed ?? hashString(`${options.empire_name}:${Date.now()}`);
  const now = new Date().toISOString();

  const ports: GameState["ports"] = {};
  for (const port of catalog.ports) {
    ports[port.id] = {
      access: port.id === scenario.home_port_id ? "home" : port.default_access,
      infrastructure: { ...port.infrastructure },
      visited: port.id === scenario.home_port_id,
      fee_multiplier: 1,
      influence: port.id === scenario.home_port_id ? 60 : 10,
    };
  }

  const ships: GameState["ships"] = {};
  scenario.starting_ships.forEach((s, i) => {
    const cls = catalog.ships.find((c) => c.id === s.class_id);
    const port = catalog.portMap.get(s.port_id);
    if (!cls || !port) throw new Error(`Scenario ${scenario.id} has an invalid starting ship`);
    const id = `ship_${i + 1}`;
    ships[id] = {
      id,
      class_id: cls.id,
      name: i === 0 && options.flagship_name?.trim() ? options.flagship_name.trim() : s.name,
      position: { lat: port.latitude, lon: port.longitude },
      heading: 90,
      speed_knots: 0,
      throttle: 0,
      rudder: 0,
      status: "docked",
      docked_port_id: port.id,
      endurance: cls.endurance_capacity,
      cargo: [],
      condition: 100,
      autopilot: true,
      route: [],
      waypoint_index: 0,
      voyage: null,
      purchased_sim_seconds: 0,
      total_distance_nm: 0,
    };
  });

  const diplomacy: GameState["diplomacy"] = {};
  for (const p of scenario.ai_polities) {
    diplomacy[p.polity_id] = { relation: p.relation, agreements: [...p.agreements], last_action_sim_seconds: null };
  }

  const objectives: GameState["objectives"] = {};
  for (const o of scenario.objectives) objectives[o.id] = { status: "active", completed_sim_seconds: null, rewarded: false };

  const treasury = Math.round(scenario.initial_treasury * (scenario.difficulty_treasury_multiplier[options.difficulty] ?? 1));

  let state: GameState = {
    version: SAVE_VERSION,
    id: uid("save"),
    created_at: now,
    updated_at: now,
    mode: scenario.mode,
    scenario_id: scenario.id,
    empire: {
      name: options.empire_name.trim() || "Unnamed house",
      polity_id: scenario.player_polity_id,
      is_fictional: true,
      emblem: options.emblem,
      home_port_id: scenario.home_port_id,
      difficulty: options.difficulty,
      motto: options.motto?.trim() || undefined,
      rules: options.rules,
    },
    date: startDate,
    start_date: startDate,
    sim_seconds: START_CLOCK_SECONDS,
    time_scale: 60,
    paused: true,
    treasury,
    ledger: [],
    ships,
    active_ship_id: Object.keys(ships)[0] ?? null,
    ports,
    contracts: {},
    voyages: [],
    technologies: [...scenario.starting_technologies],
    objectives,
    achievements: [],
    diplomacy,
    market: {},
    rivals: createRivalStates(catalog, seed, START_CLOCK_SECONDS),
    applied_events: [],
    notifications: [],
    tutorial: { step: 0, completed: false, dismissed: false },
    stats: { contracts_completed: 0, distance_sailed_nm: 0, total_revenue: 0, total_expenses: 0, goods_delivered: {}, last_maintenance_day: 0 },
    campaign: { status: "active", ended_sim_seconds: null, end_note: null },
    seed,
    pending_report: null,
    settings: { autosave: true },
  };

  state = ensureContracts(catalog, state, scenario.home_port_id);
  state = ensureTutorialContract(catalog, state);
  state = notify(state, "info", `${scenario.title}`, scenario.mode === "modern" ? "Your first ship is berthed at Port Klang. Accept a contract on the Trade screen, then set sail for Singapore." : `Your house begins at ${catalog.portMap.get(scenario.home_port_id)?.name}. Accept a cargo contract, then sail with the monsoon.`);
  return state;
}

// ---------------------------------------------------------------------------
// Contracts

export function fleetCapacity(catalog: ScenarioCatalog, state: GameState, mods: Modifiers): number {
  let max = 0;
  for (const ship of Object.values(state.ships)) {
    const cls = catalog.ships.find((c) => c.id === ship.class_id);
    if (cls) max = Math.max(max, cargoCapacity(cls, mods.cargo_multiplier));
  }
  return max || Math.min(...catalog.ships.map((s) => s.cargo_capacity));
}

/** Make sure the current week's offers exist for a port, replacing stale offers from earlier weeks. */
export function ensureContracts(catalog: ScenarioCatalog, state: GameState, portId: string): GameState {
  const mods = computeModifiers(catalog, state);
  const ctx: ContractContext = {
    catalog,
    state,
    fleet_capacity: fleetCapacity(catalog, state, mods),
    payment_multiplier: mods.contract_payment_multiplier,
    extra_contracts: mods.extra_contracts,
    event_price_mods: mods.event_price_mods,
    year: state.date.year,
  };
  const week = Math.floor(state.sim_seconds / (7 * 86400));
  const currentKey = `${portId}:${week}`;
  const contracts: Record<string, Contract> = {};
  let hasCurrent = false;
  for (const [id, c] of Object.entries(state.contracts)) {
    if (c.status === "available" && c.origin_port_id === portId && !c.mission) {
      if (c.generation_key === currentKey) {
        hasCurrent = true;
        contracts[id] = c;
      } else if (c.deadline_sim_seconds > state.sim_seconds && c.generation_key?.startsWith(`${portId}:`) && week - Number(c.generation_key.split(":")[1]) <= 1) {
        contracts[id] = c; // keep last week's unexpired offers one extra week
      }
      continue;
    }
    contracts[id] = c;
  }
  if (hasCurrent) return { ...state, contracts };
  const origin = catalog.portMap.get(portId);
  if (!origin) return state;
  for (const c of generateContractsForPort(ctx, origin)) {
    if (!contracts[c.id]) contracts[c.id] = c;
  }
  return { ...state, contracts };
}

/**
 * Guarantee that the tutorial objective's destination has an offer at the home port at the
 * start of a campaign, so the first voyage is always available.
 */
export function ensureTutorialContract(catalog: ScenarioCatalog, state: GameState): GameState {
  const tutorial = catalog.scenario.objectives.find((o) => o.tutorial && o.condition.type === "contracts_completed_with_port");
  if (!tutorial || tutorial.condition.type !== "contracts_completed_with_port") return state;
  const destId = tutorial.condition.port_id;
  const exists = Object.values(state.contracts).some((c) => c.status === "available" && c.origin_port_id === state.empire.home_port_id && c.destination_port_id === destId);
  if (exists) return state;
  const origin = catalog.portMap.get(state.empire.home_port_id);
  const destination = catalog.portMap.get(destId);
  if (!origin || !destination) return state;
  const mods = computeModifiers(catalog, state);
  const ctx: ContractContext = {
    catalog,
    state,
    fleet_capacity: fleetCapacity(catalog, state, mods),
    payment_multiplier: mods.contract_payment_multiplier,
    extra_contracts: 0,
    event_price_mods: mods.event_price_mods,
    year: state.date.year,
  };
  const contract = buildTutorialContract(ctx, origin, destination);
  if (!contract) return state;
  return { ...state, contracts: { ...state.contracts, [contract.id]: contract } };
}

export function acceptContract(catalog: ScenarioCatalog, state: GameState, contractId: string, shipId: string): GameState {
  const contract = state.contracts[contractId];
  const ship = state.ships[shipId];
  if (!contract || !ship) throw new TransactionError("Unknown contract or ship.");
  const cls = requireClass(catalog, ship.class_id);
  const mods = computeModifiers(catalog, state);
  const check = validateAccept(catalog, state, contract, ship, cls, mods.cargo_multiplier);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot accept contract.");
  const updatedShip: ShipState = {
    ...ship,
    cargo: [...ship.cargo, { good_id: contract.good_id, quantity: contract.quantity, contract_id: contract.id, bought_at: null }],
  };
  return noteCompetition(catalog, {
    ...state,
    ships: { ...state.ships, [shipId]: updatedShip },
    contracts: { ...state.contracts, [contractId]: { ...contract, status: "accepted", assigned_ship_id: shipId } },
  }, contract);
}

export function abandonContract(catalog: ScenarioCatalog, state: GameState, contractId: string): GameState {
  const contract = state.contracts[contractId];
  if (!contract || !contract.assigned_ship_id) throw new TransactionError("Contract is not assigned.");
  const ship = state.ships[contract.assigned_ship_id];
  if (!ship) throw new TransactionError("Unknown ship.");
  if (ship.status !== "docked") throw new TransactionError("Cargo can only be returned while docked.");
  const penalty = Math.round(contract.payment * 0.1);
  let next: GameState = {
    ...state,
    ships: { ...state.ships, [ship.id]: { ...ship, cargo: ship.cargo.filter((c) => c.contract_id !== contractId) } },
    contracts: { ...state.contracts, [contractId]: { ...contract, status: "failed", assigned_ship_id: null } },
  };
  next = applyTransaction(next, -penalty, "contract_penalty", `Contract cancelled: ${contract.good_id}`, { ship_id: ship.id, allow_negative: true });
  return next;
}

// ---------------------------------------------------------------------------
// Navigation

export function setDestination(catalog: ScenarioCatalog, state: GameState, shipId: string, portId: string): GameState {
  const ship = state.ships[shipId];
  const dest = catalog.portMap.get(portId);
  const destState = state.ports[portId];
  if (!ship || !dest || !destState) throw new TransactionError("Unknown ship or port.");
  if (destState.access === "closed") throw new TransactionError(`${dest.name} is closed to your ships.`);
  if (destState.access === "restricted") throw new TransactionError(`${dest.name} requires an access agreement.`);
  if (ship.docked_port_id === portId && ship.status === "docked") throw new TransactionError("The ship is already at that port.");
  const year = state.date.year;
  let planned;
  if (ship.status === "docked" && ship.docked_port_id) {
    const origin = catalog.portMap.get(ship.docked_port_id);
    if (!origin) throw new TransactionError("Unknown origin port.");
    planned = planRoute(origin, dest, year);
  } else {
    planned = planRouteFromPosition(ship.position, dest, year);
  }
  if (!planned) throw new TransactionError("No sea route to that port.");
  const updated: ShipState = { ...ship, route: planned.waypoints, waypoint_index: ship.status === "docked" ? 1 : 1 };
  if (ship.status !== "docked" && ship.voyage) {
    updated.voyage = { ...ship.voyage, destination_port_id: portId, distance_total_nm: ship.voyage.distance_sailed_nm + planned.distance_nm };
  }
  return { ...state, ships: { ...state.ships, [shipId]: updated } };
}

export function departShip(catalog: ScenarioCatalog, state: GameState, shipId: string): GameState {
  const ship = state.ships[shipId];
  if (!ship) throw new TransactionError("Unknown ship.");
  if (ship.status !== "docked" || !ship.docked_port_id) throw new TransactionError("The ship is already under way.");
  if (ship.route.length < 2) throw new TransactionError("Set a destination first.");
  if (ship.endurance <= 0) throw new TransactionError(catalog.scenario.features.fuel ? "Refuel before departing." : "Take on provisions before departing.");
  const last = ship.route[ship.route.length - 1];
  const destId = last?.port_id;
  if (!destId) throw new TransactionError("Route has no destination port.");
  const distance = ship.route.reduce((sum, wp, i) => (i === 0 ? 0 : sum + distanceNm(ship.route[i - 1] as GeoPoint, wp)), 0);
  const contracts = { ...state.contracts };
  for (const item of ship.cargo) {
    if (item.contract_id && contracts[item.contract_id]?.status === "accepted") {
      contracts[item.contract_id] = { ...(contracts[item.contract_id] as Contract), status: "in_transit" };
    }
  }
  const updated: ShipState = {
    ...ship,
    status: "sailing",
    docked_port_id: null,
    autopilot: true,
    throttle: 1,
    rudder: 0,
    waypoint_index: 1,
    voyage: {
      origin_port_id: ship.docked_port_id,
      destination_port_id: destId,
      departed_sim_seconds: state.sim_seconds,
      distance_total_nm: distance,
      distance_sailed_nm: 0,
      fuel_used: 0,
      fees_paid: 0,
    },
  };
  return { ...state, ships: { ...state.ships, [shipId]: updated }, contracts, paused: false };
}

export function setShipControls(state: GameState, shipId: string, controls: Partial<Pick<ShipState, "throttle" | "rudder" | "autopilot">>): GameState {
  const ship = state.ships[shipId];
  if (!ship) return state;
  const updated: ShipState = { ...ship };
  if (controls.throttle !== undefined) updated.throttle = clamp(controls.throttle, 0, 1);
  if (controls.rudder !== undefined) updated.rudder = clamp(controls.rudder, -1, 1);
  if (controls.autopilot !== undefined) updated.autopilot = controls.autopilot;
  return { ...state, ships: { ...state.ships, [shipId]: updated } };
}

// ---------------------------------------------------------------------------
// Docking and voyage completion

function requireClass(catalog: ScenarioCatalog, classId: string): VesselClass {
  const cls = catalog.ships.find((c) => c.id === classId);
  if (!cls) throw new Error(`Unknown vessel class ${classId}`);
  return cls;
}

export function dockShip(catalog: ScenarioCatalog, state: GameState, shipId: string, portId: string): { state: GameState; report: VoyageRecord } {
  const ship = state.ships[shipId];
  const port = catalog.portMap.get(portId);
  if (!ship || !port) throw new Error("Unknown ship or port");
  const cls = requireClass(catalog, ship.class_id);
  const mods = computeModifiers(catalog, state);
  const notes: string[] = [];
  let revenue = 0;
  let bonuses = 0;
  let penalties = 0;
  let expenses = 0;
  const completedIds: string[] = [];

  let next: GameState = { ...state };

  // Port fees are a running cost: charged even if the treasury dips below zero.
  const fee = portFee(catalog, next, portId, cls.cargo_capacity, mods.port_fee_multiplier * rivalFeeMultiplier(catalog, next, portId));
  if (fee > 0) {
    next = applyTransaction(next, -fee, "port_fee", `Port fees at ${port.name}`, { ship_id: shipId, port_id: portId, allow_negative: true });
    expenses += fee;
  }

  // Deliver contract cargo bound for this port.
  const remainingCargo = [];
  const contracts = { ...next.contracts };
  const goodsDelivered = { ...next.stats.goods_delivered };
  for (const item of ship.cargo) {
    const contract = item.contract_id ? contracts[item.contract_id] : undefined;
    if (contract && contract.destination_port_id === portId && !contract.paid && contract.status !== "completed") {
      const originInfra = next.ports[contract.origin_port_id]?.infrastructure.cargo_handling ?? 0;
      let payment = Math.round(contract.payment * (1 + 0.03 * originInfra));
      const late = next.sim_seconds > contract.deadline_sim_seconds;
      if (late) {
        const penalty = Math.round(payment * 0.35);
        payment -= penalty;
        penalties += penalty;
        notes.push(`Late delivery of ${contract.good_id.replace(/^good_/, "")}: payment reduced by 35%.`);
      } else if (next.sim_seconds < contract.deadline_sim_seconds - 2 * SECONDS_PER_DAY) {
        const bonus = Math.round(contract.payment * 0.05);
        payment += bonus;
        bonuses += bonus;
        notes.push("Early delivery bonus of 5%.");
      }
      next = applyTransaction(next, payment, "contract_payment", `Delivered ${contract.quantity} ${contract.good_id.replace(/^good_/, "")} to ${port.name}`, { ship_id: shipId, port_id: portId });
      revenue += payment;
      contracts[contract.id] = { ...contract, status: "completed", completed_sim_seconds: next.sim_seconds, paid: true };
      completedIds.push(contract.id);
      goodsDelivered[contract.good_id] = (goodsDelivered[contract.good_id] ?? 0) + contract.quantity;
    } else {
      remainingCargo.push(item);
    }
  }

  const voyage = ship.voyage;
  const fuelCost = voyage ? Math.round(voyage.fuel_used * catalog.scenario.fuel_price_per_unit) : 0;
  if (fuelCost > 0) {
    expenses += fuelCost; // already paid at refuelling; reported for information
    notes.push(`${catalog.scenario.features.fuel ? "Fuel" : "Provisions"} consumed: about ${Math.round(voyage?.fuel_used ?? 0)} ${catalog.scenario.fuel_unit_label}, worth ${formatMoneyExact(fuelCost, catalog.scenario.currency)} ${catalog.scenario.currency.symbol ? "" : catalog.scenario.currency.code} at current prices.`);
  }

  const report: VoyageRecord = {
    id: uid("voy"),
    ship_id: shipId,
    ship_name: ship.name,
    origin_port_id: voyage?.origin_port_id ?? portId,
    destination_port_id: portId,
    departed_sim_seconds: voyage?.departed_sim_seconds ?? next.sim_seconds,
    arrived_sim_seconds: next.sim_seconds,
    distance_nm: Math.round(voyage?.distance_sailed_nm ?? 0),
    revenue,
    expenses,
    bonuses,
    penalties,
    net: revenue - expenses,
    contracts_completed: completedIds,
    notes,
  };

  const portState = next.ports[portId];
  const updatedShip: ShipState = {
    ...ship,
    status: "docked",
    docked_port_id: portId,
    position: { lat: port.latitude, lon: port.longitude },
    speed_knots: 0,
    throttle: 0,
    rudder: 0,
    route: [],
    waypoint_index: 0,
    voyage: null,
    cargo: remainingCargo,
    condition: clamp(ship.condition - (voyage ? Math.min(6, voyage.distance_sailed_nm / 600) : 0), 0, 100),
  };

  next = {
    ...next,
    ships: { ...next.ships, [shipId]: updatedShip },
    contracts,
    ports: portState ? { ...next.ports, [portId]: { ...portState, visited: true, influence: clamp(portState.influence + 3, 0, 100) } } : next.ports,
    voyages: [report, ...next.voyages].slice(0, 100),
    stats: { ...next.stats, contracts_completed: next.stats.contracts_completed + completedIds.length, goods_delivered: goodsDelivered },
    pending_report: report,
  };
  next = ensureContracts(catalog, next, portId);
  next = notify(next, "success", `${ship.name} arrived at ${port.name}`, completedIds.length > 0 ? `${completedIds.length} contract${completedIds.length > 1 ? "s" : ""} completed. Net result ${report.net >= 0 ? "+" : ""}${report.net}.` : `Port fees of ${fee} paid.`, "/play/fleet");
  return { state: next, report };
}

// ---------------------------------------------------------------------------
// Trading at port

export function buyCargo(catalog: ScenarioCatalog, state: GameState, shipId: string, goodId: string, quantity: number): GameState {
  const ship = state.ships[shipId];
  const good = catalog.goodMap.get(goodId);
  if (!ship || !good) throw new TransactionError("Unknown ship or good.");
  if (ship.status !== "docked" || !ship.docked_port_id) throw new TransactionError("The ship must be docked.");
  const port = catalog.portMap.get(ship.docked_port_id);
  if (!port) throw new TransactionError("Unknown port.");
  if (!Number.isInteger(quantity) || quantity <= 0) throw new TransactionError("Quantity must be a positive whole number.");
  const stock = marketStock(port, good, state.seed, state.sim_seconds) - purchasedThisWeek(state, port.id, goodId);
  if (quantity > stock) throw new TransactionError(`Only ${Math.max(0, stock)} available this week.`);
  const cls = requireClass(catalog, ship.class_id);
  const mods = computeModifiers(catalog, state);
  const free = cargoCapacity(cls, mods.cargo_multiplier) - cargoUsed(ship, catalog);
  if (quantity * good.cargo_space > free + 1e-6) throw new TransactionError("Not enough cargo space.");
  const price = marketPrice(port, good, state.seed, state.sim_seconds, mods.event_price_mods[goodId] ?? 1, state.ports[port.id]);
  const total = price * quantity;
  if (!canAfford(state, total)) throw new TransactionError("Insufficient treasury.");
  let next = applyTransaction(state, -total, "cargo_purchase", `Bought ${quantity} ${good.name} at ${port.name}`, { ship_id: shipId, port_id: port.id });
  const existing = ship.cargo.find((c) => c.good_id === goodId && c.contract_id === null);
  const cargo = existing
    ? ship.cargo.map((c) => (c === existing ? { ...c, quantity: c.quantity + quantity, bought_at: Math.round(((c.bought_at ?? price) * c.quantity + price * quantity) / (c.quantity + quantity)) } : c))
    : [...ship.cargo, { good_id: goodId, quantity, contract_id: null, bought_at: price }];
  next = { ...next, ships: { ...next.ships, [shipId]: { ...ship, cargo } } };
  next = { ...next, market: { ...next.market, [`${port.id}:${goodId}:${Math.floor(state.sim_seconds / (7 * 86400))}`]: { bought: { price, stock: quantity } } } };
  return next;
}

function purchasedThisWeek(state: GameState, portId: string, goodId: string): number {
  const key = `${portId}:${goodId}:${Math.floor(state.sim_seconds / (7 * 86400))}`;
  return state.market[key]?.bought?.stock ?? 0;
}

export function sellCargo(catalog: ScenarioCatalog, state: GameState, shipId: string, goodId: string, quantity: number): GameState {
  const ship = state.ships[shipId];
  const good = catalog.goodMap.get(goodId);
  if (!ship || !good) throw new TransactionError("Unknown ship or good.");
  if (ship.status !== "docked" || !ship.docked_port_id) throw new TransactionError("The ship must be docked.");
  const port = catalog.portMap.get(ship.docked_port_id);
  if (!port) throw new TransactionError("Unknown port.");
  const item = ship.cargo.find((c) => c.good_id === goodId && c.contract_id === null);
  if (!item) throw new TransactionError("No such cargo on board (contract cargo cannot be sold).");
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > item.quantity) throw new TransactionError("Invalid quantity.");
  const mods = computeModifiers(catalog, state);
  const price = marketPrice(port, good, state.seed, state.sim_seconds, mods.event_price_mods[goodId] ?? 1, state.ports[port.id]);
  const total = price * quantity;
  let next = applyTransaction(state, total, "cargo_sale", `Sold ${quantity} ${good.name} at ${port.name}`, { ship_id: shipId, port_id: port.id });
  const cargo = ship.cargo
    .map((c) => (c === item ? { ...c, quantity: c.quantity - quantity } : c))
    .filter((c) => c.quantity > 0);
  next = { ...next, ships: { ...next.ships, [shipId]: { ...ship, cargo } } };
  return next;
}

export function refuelShip(catalog: ScenarioCatalog, state: GameState, shipId: string, amount: number): GameState {
  const ship = state.ships[shipId];
  if (!ship) throw new TransactionError("Unknown ship.");
  if (ship.status !== "docked" || !ship.docked_port_id) throw new TransactionError("The ship must be docked.");
  const cls = requireClass(catalog, ship.class_id);
  const room = cls.endurance_capacity - ship.endurance;
  const qty = Math.min(Math.max(0, amount), room);
  if (qty <= 0) throw new TransactionError("Already full.");
  const port = catalog.portMap.get(ship.docked_port_id);
  const cost = Math.round(qty * catalog.scenario.fuel_price_per_unit * (port?.fee_modifier ?? 1));
  if (!canAfford(state, cost)) throw new TransactionError("Insufficient treasury.");
  const label = catalog.scenario.features.fuel ? "fuel" : "provisions";
  let next = applyTransaction(state, -cost, catalog.scenario.features.fuel ? "fuel" : "provisions", `Took on ${Math.round(qty)} ${catalog.scenario.fuel_unit_label} of ${label} at ${port?.name}`, { ship_id: shipId, port_id: port?.id ?? null });
  next = { ...next, ships: { ...next.ships, [shipId]: { ...ship, endurance: ship.endurance + qty } } };
  return next;
}

export function repairShip(catalog: ScenarioCatalog, state: GameState, shipId: string): GameState {
  const ship = state.ships[shipId];
  if (!ship) throw new TransactionError("Unknown ship.");
  if (ship.status !== "docked" || !ship.docked_port_id) throw new TransactionError("The ship must be docked.");
  if (ship.condition >= 100) throw new TransactionError("No repairs needed.");
  const cls = requireClass(catalog, ship.class_id);
  const cost = repairCost(catalog, state, ship.docked_port_id, cls.purchase_cost, ship.condition);
  if (!canAfford(state, cost)) throw new TransactionError("Insufficient treasury.");
  let next = applyTransaction(state, -cost, "repair", `Repairs to ${ship.name}`, { ship_id: shipId, port_id: ship.docked_port_id });
  next = { ...next, ships: { ...next.ships, [shipId]: { ...ship, condition: 100 } } };
  return next;
}

// ---------------------------------------------------------------------------
// Fleet

export interface PurchaseCheck {
  ok: boolean;
  reason?: string;
}

export function canBuyShip(catalog: ScenarioCatalog, state: GameState, cls: VesselClass, portId: string): PurchaseCheck {
  if (!catalog.scenario.ship_classes.includes(cls.id)) return { ok: false, reason: "Not available in this scenario." };
  const ps = state.ports[portId];
  if (!ps) return { ok: false, reason: "Unknown port." };
  const yard = ps.infrastructure.shipyard ?? 0;
  if (yard < cls.required_shipyard_level) return { ok: false, reason: `Requires a level ${cls.required_shipyard_level} shipyard at this port (currently ${yard}).` };
  if (!(ps.access === "home" || ps.access === "agreement" || (catalog.scenario.mode === "modern" && ps.visited))) return { ok: false, reason: "Ships can be acquired at your home port or at ports where you hold an agreement." };
  if (cls.required_technology) {
    const mods = computeModifiers(catalog, state);
    if (!state.technologies.includes(cls.required_technology) && !mods.unlocked_ships.has(cls.id)) {
      const tech = catalog.technologies.find((t) => t.id === cls.required_technology);
      return { ok: false, reason: `Requires ${tech?.name ?? cls.required_technology}.` };
    }
  }
  if (state.treasury < cls.purchase_cost) return { ok: false, reason: "Insufficient treasury." };
  return { ok: true };
}

export function buyShip(catalog: ScenarioCatalog, state: GameState, classId: string, name: string, portId: string): GameState {
  const cls = requireClass(catalog, classId);
  const check = canBuyShip(catalog, state, cls, portId);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot buy ship.");
  const port = catalog.portMap.get(portId);
  if (!port) throw new TransactionError("Unknown port.");
  let next = applyTransaction(state, -cls.purchase_cost, "ship_purchase", `Acquired ${cls.name_or_class} "${name}"`, { port_id: portId });
  const id = uid("ship");
  const ship: ShipState = {
    id,
    class_id: cls.id,
    name: name.trim() || cls.name_or_class,
    position: { lat: port.latitude, lon: port.longitude },
    heading: 90,
    speed_knots: 0,
    throttle: 0,
    rudder: 0,
    status: "docked",
    docked_port_id: portId,
    endurance: cls.endurance_capacity,
    cargo: [],
    condition: 100,
    autopilot: true,
    route: [],
    waypoint_index: 0,
    voyage: null,
    purchased_sim_seconds: state.sim_seconds,
    total_distance_nm: 0,
  };
  next = { ...next, ships: { ...next.ships, [id]: ship } };
  next = notify(next, "success", "New vessel", `${ship.name} (${cls.name_or_class}) joins the fleet at ${port.name}.`, "/play/fleet");
  return next;
}

export function sellShipValue(cls: VesselClass, ship: ShipState): number {
  return Math.round(cls.purchase_cost * 0.55 * (0.5 + ship.condition / 200));
}

export function sellShip(catalog: ScenarioCatalog, state: GameState, shipId: string): GameState {
  const ship = state.ships[shipId];
  if (!ship) throw new TransactionError("Unknown ship.");
  if (Object.keys(state.ships).length <= 1) throw new TransactionError("You cannot sell your last ship.");
  if (ship.status !== "docked") throw new TransactionError("The ship must be docked.");
  if (ship.cargo.some((c) => c.contract_id)) throw new TransactionError("Return contract cargo before selling.");
  const cls = requireClass(catalog, ship.class_id);
  let next = applyTransaction(state, sellShipValue(cls, ship), "ship_sale", `Sold ${ship.name}`, { ship_id: shipId });
  const ships = { ...next.ships };
  delete ships[shipId];
  next = { ...next, ships, active_ship_id: next.active_ship_id === shipId ? Object.keys(ships)[0] ?? null : next.active_ship_id };
  return next;
}

export function renameShip(state: GameState, shipId: string, name: string): GameState {
  const ship = state.ships[shipId];
  if (!ship || !name.trim()) return state;
  return { ...state, ships: { ...state.ships, [shipId]: { ...ship, name: name.trim().slice(0, 40) } } };
}

// ---------------------------------------------------------------------------
// Development, technology, diplomacy

export function developPort(catalog: ScenarioCatalog, state: GameState, portId: string, kind: PortInfrastructureKind): GameState {
  const check = canDevelop(catalog, state, portId, kind);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot develop.");
  const ps = state.ports[portId];
  const port = catalog.portMap.get(portId);
  if (!ps || !port) throw new TransactionError("Unknown port.");
  let next = applyTransaction(state, -check.cost, "infrastructure", `${kind.replace("_", " ")} level ${check.next_level} at ${port.name}`, { port_id: portId });
  next = { ...next, ports: { ...next.ports, [portId]: { ...ps, infrastructure: { ...ps.infrastructure, [kind]: check.next_level }, influence: clamp(ps.influence + 5, 0, 100) } } };
  return next;
}

export function researchTechnology(catalog: ScenarioCatalog, state: GameState, techId: string): GameState {
  const tech = catalog.technologies.find((t) => t.id === techId);
  if (!tech) throw new TransactionError("Unknown technology.");
  const check = canResearch(catalog, state, tech);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot research.");
  let next = applyTransaction(state, -tech.cost, "technology", `Acquired ${tech.name}`);
  next = { ...next, technologies: [...next.technologies, tech.id] };
  next = notify(next, "success", tech.name, tech.description, "/play/technology");
  return next;
}

export type DiplomaticAction = "gift" | "request_access" | "trade_agreement";

export function diplomacyCost(catalog: ScenarioCatalog, action: DiplomaticAction): number {
  const scale = Math.min(...catalog.ships.map((s) => s.purchase_cost));
  switch (action) {
    case "gift": return Math.round(scale * 0.15);
    case "request_access": return Math.round(scale * 0.4);
    case "trade_agreement": return Math.round(scale * 0.8);
  }
}

export function canPerformDiplomacy(catalog: ScenarioCatalog, state: GameState, polityId: string, action: DiplomaticAction): PurchaseCheck {
  if (!catalog.scenario.features.diplomacy) return { ok: false, reason: "Not available in this scenario." };
  const rel = state.diplomacy[polityId];
  if (!rel) return { ok: false, reason: "Unknown polity." };
  if (polityId === catalog.scenario.player_polity_id && action !== "gift") return { ok: false, reason: "This is your own sovereign." };
  const cost = diplomacyCost(catalog, action);
  if (state.treasury < cost) return { ok: false, reason: "Insufficient treasury." };
  if (action === "gift" && rel.last_action_sim_seconds !== null && state.sim_seconds - rel.last_action_sim_seconds < 30 * SECONDS_PER_DAY) return { ok: false, reason: "An embassy was sent recently; wait a month." };
  if (action === "request_access") {
    if (rel.agreements.includes("port_access")) return { ok: false, reason: "Access already granted." };
    if (rel.relation < 55) return { ok: false, reason: "Relations must reach 55 first." };
  }
  if (action === "trade_agreement") {
    if (rel.agreements.includes("trade_agreement")) return { ok: false, reason: "Agreement already in force." };
    if (!rel.agreements.includes("port_access")) return { ok: false, reason: "Secure port access first." };
    if (rel.relation < 70) return { ok: false, reason: "Relations must reach 70 first." };
  }
  return { ok: true };
}

export function performDiplomacy(catalog: ScenarioCatalog, state: GameState, polityId: string, action: DiplomaticAction): GameState {
  const check = canPerformDiplomacy(catalog, state, polityId, action);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot do that.");
  const rel = state.diplomacy[polityId];
  if (!rel) throw new TransactionError("Unknown polity.");
  const civ = catalog.civilizations.find((c) => c.id === polityId);
  const cost = diplomacyCost(catalog, action);
  let next = applyTransaction(state, -cost, "diplomacy", `${action === "gift" ? "Gifts" : action === "request_access" ? "Embassy for port access" : "Trade agreement"} — ${civ?.canonical_name ?? polityId}`);
  const updated = { ...rel, last_action_sim_seconds: state.sim_seconds };
  const ports = { ...next.ports };
  if (action === "gift") updated.relation = clamp(rel.relation + 8, 0, 100);
  if (action === "request_access") {
    updated.agreements = [...rel.agreements, "port_access"];
    updated.relation = clamp(rel.relation + 5, 0, 100);
    for (const port of catalog.ports) {
      const ps = ports[port.id];
      if (port.polity_id === polityId && ps && (ps.access === "restricted" || ps.access === "closed")) ports[port.id] = { ...ps, access: "agreement" };
    }
  }
  if (action === "trade_agreement") {
    updated.agreements = [...rel.agreements, "trade_agreement"];
    updated.relation = clamp(rel.relation + 5, 0, 100);
    for (const port of catalog.ports) {
      const ps = ports[port.id];
      if (port.polity_id === polityId && ps && ps.access !== "home") ports[port.id] = { ...ps, access: "agreement", fee_multiplier: ps.fee_multiplier * 0.85 };
    }
  }
  next = { ...next, diplomacy: { ...next.diplomacy, [polityId]: updated }, ports };
  next = notify(next, "success", civ?.canonical_name ?? polityId, action === "gift" ? "Your gifts were well received." : action === "request_access" ? "Your ships may now call at their ports." : "A trade agreement is in force: reduced fees at their ports.", "/play/diplomacy");
  return next;
}

// ---------------------------------------------------------------------------
// Simulation tick

export interface TickResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Advance the simulation by `dtSim` simulated seconds. Movement is integrated in substeps
 * so that high time-acceleration does not let ships overshoot waypoints.
 */
export function tickGame(catalog: ScenarioCatalog, state: GameState, dtSim: number): TickResult {
  const events: GameEvent[] = [];
  if (state.paused || state.campaign.status !== "active" || dtSim <= 0) return { state, events };

  const mods = computeModifiers(catalog, state);
  const wind = catalog.scenario.features.wind ? windForDate(catalog.scenario.wind, state.date.month, state.date.day) : null;
  const ships = { ...state.ships };
  let next: GameState = { ...state, ships };
  let distanceThisTick = 0;

  for (const shipId of Object.keys(ships)) {
    let ship = ships[shipId];
    if (!ship || ship.status === "docked") continue;
    const cls = requireClass(catalog, ship.class_id);
    let remaining = dtSim;
    let arrivedAt: string | null = null;
    let enduranceEmptied = false;

    while (remaining > 0 && !arrivedAt) {
      const dt = Math.min(remaining, MAX_SUBSTEP_SECONDS);
      remaining -= dt;
      const target = ship.route[ship.waypoint_index];
      let throttle: number = ship.throttle;
      let rudder: number = ship.rudder;
      if (ship.autopilot && target) {
        const ap = computeAutopilot(cls, ship.position, ship.heading, ship.speed_knots, target, ship.waypoint_index === ship.route.length - 1, wind, next.sim_seconds, dt);
        throttle = ap.throttle;
        rudder = ap.rudder;
      } else if (ship.autopilot && !target) {
        throttle = 0;
        rudder = 0;
      }
      const empty = ship.endurance <= 0;
      const result = stepKinematics(cls, { position: ship.position, heading: ship.heading, speed_knots: ship.speed_knots, throttle, rudder }, dt, wind, mods, empty);
      const endurance = Math.max(0, ship.endurance - result.endurance_used);
      if (ship.endurance > 0 && endurance === 0) enduranceEmptied = true;
      ship = {
        ...ship,
        position: result.kinematics.position,
        heading: result.kinematics.heading,
        speed_knots: result.kinematics.speed_knots,
        throttle,
        rudder,
        endurance,
        status: endurance === 0 && cls.propulsion === "engine" ? "drifting" : "sailing",
        total_distance_nm: ship.total_distance_nm + result.distance_nm,
        voyage: ship.voyage ? { ...ship.voyage, distance_sailed_nm: ship.voyage.distance_sailed_nm + result.distance_nm, fuel_used: ship.voyage.fuel_used + result.endurance_used } : null,
      };
      distanceThisTick += result.distance_nm;

      if (ship.route.length > 0) {
        const adv = advanceWaypoint(ship.position, ship.route, ship.waypoint_index);
        if (adv.index !== ship.waypoint_index) {
          ship = { ...ship, waypoint_index: adv.index };
          const last = adv.reached[adv.reached.length - 1];
          if (adv.index >= ship.route.length && last?.port_id) arrivedAt = last.port_id;
        }
      }
    }

    ships[shipId] = ship;
    if (enduranceEmptied) {
      events.push({ type: "endurance_empty", ship_id: shipId });
      next = notify({ ...next, ships }, "warning", `${ship.name}: ${cls.propulsion === "engine" ? "out of fuel" : "provisions exhausted"}`, cls.propulsion === "engine" ? "The ship is drifting. Reach a port to refuel." : "The crew is on short rations and the ship sails slowly.", "/play/sail");
    }
    if (arrivedAt) {
      const docked = dockShip(catalog, { ...next, ships }, shipId, arrivedAt);
      next = docked.state;
      Object.assign(ships, next.ships);
      events.push({ type: "arrived", ship_id: shipId, port_id: arrivedAt, report: docked.report });
    }
  }
  next = { ...next, ships: { ...next.ships, ...ships } };

  // AI trading powers sail the same lanes and work the same contract board.
  const rivalTick = tickRivals(catalog, next, dtSim);
  next = rivalTick.state;
  for (const ev of rivalTick.events) {
    const def = rivalDefinition(catalog, ev.rival_id);
    const name = def?.name ?? ev.rival_id;
    if (ev.type === "rival_contract_taken") {
      events.push({ type: "rival_contract_taken", rival_id: ev.rival_id, contract_id: ev.contract.id, port_id: ev.port_id });
      // Only worth a notification where the player is actually trading.
      const playerHere = ev.port_id === next.empire.home_port_id || Object.values(next.ships).some((sh) => sh.docked_port_id === ev.port_id);
      if (playerHere) {
        const good = catalog.goodMap.get(ev.contract.good_id);
        const dest = catalog.portMap.get(ev.contract.destination_port_id);
        next = notify(next, "info", `${name} took a contract`, `${ev.contract.quantity} ${good?.name ?? ev.contract.good_id} from ${catalog.portMap.get(ev.port_id)?.name ?? ev.port_id} to ${dest?.name ?? ev.contract.destination_port_id} is no longer on offer.`, "/play/rivals");
      }
    } else if (ev.type === "rival_partnership_ended") {
      events.push(ev);
      next = notify(next, "warning", `${name} ended the partnership`, "Relations fell too far for the agreement to hold. Courtesies can rebuild them.", "/play/rivals");
    }
  }

  // Clock.
  const newSimSeconds = next.sim_seconds + dtSim;
  const dayBefore = Math.floor(next.sim_seconds / SECONDS_PER_DAY);
  const dayAfter = Math.floor(newSimSeconds / SECONDS_PER_DAY);
  next = { ...next, sim_seconds: newSimSeconds, date: addSeconds(next.start_date, newSimSeconds) as GameDate, stats: { ...next.stats, distance_sailed_nm: next.stats.distance_sailed_nm + distanceThisTick } };

  if (dayAfter > dayBefore) {
    const days = dayAfter - dayBefore;
    // Daily running costs and income.
    let maintenance = 0;
    for (const ship of Object.values(next.ships)) {
      const cls = catalog.ships.find((c) => c.id === ship.class_id);
      if (cls) maintenance += cls.maintenance_per_day * mods.maintenance_multiplier * days;
    }
    maintenance = Math.round(maintenance);
    if (maintenance > 0) next = applyTransaction(next, -maintenance, "maintenance", days > 1 ? `Fleet upkeep (${days} days)` : "Daily fleet upkeep", { allow_negative: true });
    const income = dailyAdministrationIncome(catalog, next) * days;
    if (income > 0) next = applyTransaction(next, income, "income", "Customs duties at home port", { port_id: next.empire.home_port_id });
    next = { ...next, stats: { ...next.stats, last_maintenance_day: dayAfter } };

    // Expire stale offers.
    const contracts: Record<string, Contract> = {};
    for (const [id, c] of Object.entries(next.contracts)) {
      if (c.status === "available" && c.deadline_sim_seconds < next.sim_seconds) continue;
      contracts[id] = c;
    }
    next = { ...next, contracts };

    // Historical events.
    const sandbox = next.empire.rules === "sandbox";
    for (const event of dueEvents(catalog, next)) {
      if (sandbox) {
        // Alternate history: the documented event is announced, its effects are not applied.
        next = { ...next, applied_events: [...next.applied_events, event.id] };
        next = notify(next, "event", event.title, `${event.summary} (Alternate-history sandbox: no gameplay effect applied.)`, "/play/history");
      } else {
        next = applyEvent(next, event);
        next = notify(next, "event", event.title, `${event.summary}${event.effects.length > 0 && event.effects[0]?.type !== "notice" ? " Simulated consequences now apply." : ""}`, "/play/history");
        const reaction = reactToEvent(catalog, next, event);
        next = reaction.state;
        if (reaction.notes.length > 0) next = notify(next, "info", `Rivals respond to ${event.title.toLowerCase()}`, reaction.notes.join(" "), "/play/rivals");
      }
      events.push({ type: "historical_event", event });
      if (next.campaign.status !== "active") events.push({ type: "campaign_ended", status: next.campaign.status });
    }
    // Campaign end by date (historical rules only).
    const endDate = dateFromIso(catalog.scenario.end_date);
    if (!sandbox && next.campaign.status === "active" && next.date.year > endDate.year) {
      next = { ...next, paused: true, campaign: { status: "historical_end", ended_sim_seconds: next.sim_seconds, end_note: "The campaign period has ended." } };
      events.push({ type: "campaign_ended", status: "historical_end" });
    }
  }

  // Objectives.
  const evaluated = evaluateObjectives(catalog, next);
  next = evaluated.state;
  for (const obj of evaluated.completed) {
    if (obj.reward > 0) next = applyTransaction(next, obj.reward, "objective_reward", `Objective completed: ${obj.title}`);
    next = { ...next, objectives: { ...next.objectives, [obj.id]: { status: "completed", completed_sim_seconds: next.sim_seconds, rewarded: true } }, achievements: [...next.achievements, obj.id] };
    if (obj.tutorial) next = { ...next, tutorial: { ...next.tutorial, completed: true } };
    next = notify(next, "objective", `Objective complete: ${obj.title}`, obj.reward > 0 ? `Reward: ${obj.reward}.` : obj.description, "/play/missions");
    events.push({ type: "objective_completed", objective: obj });
  }

  return { state: next, events };
}

export function setTimeScale(state: GameState, scale: number): GameState {
  return { ...state, time_scale: clamp(scale, 1, 7200) };
}

export function setPaused(state: GameState, paused: boolean): GameState {
  return { ...state, paused };
}

export function setActiveShip(state: GameState, shipId: string): GameState {
  return state.ships[shipId] ? { ...state, active_ship_id: shipId } : state;
}

export function dismissReport(state: GameState): GameState {
  return { ...state, pending_report: null };
}

export function markNotificationsRead(state: GameState): GameState {
  return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
}

export { TransactionError };
