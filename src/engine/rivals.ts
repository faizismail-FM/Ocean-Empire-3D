import type { ScenarioCatalog } from "@/data";
import type { PortRecord, RivalDefinition, VesselClass } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { buildContract, type ContractContext } from "./contracts";
import { applyTransaction, TransactionError } from "./economy";
import { distanceNm, initialBearing, interpolate, type GeoPoint } from "./geo";
import { infrastructureCost } from "./portdev";
import { createRandom } from "./rng";
import { planRoute } from "./routing";
import { cruiseSpeed, estimateEndurance } from "./ship";
import type { Contract, GameState, RivalShip, RivalState } from "./state";

/**
 * AI trading powers ("rivals"). Each runs a small fleet on the same ports, sea lanes and
 * contract board as the player:
 *
 *  - A docked rival ship waits out a turnaround, then either takes one of the contracts on
 *    offer at that port (removing it from the board) or sails on its own account to a port
 *    that wants what this one supplies.
 *  - Ships move along planned routes at their class cruise speed; arrival pays the rival,
 *    charges fuel and fees, and counts a port call, which is what market share is made of.
 *  - With money in hand a rival buys ships (up to a personality-dependent cap) and builds
 *    cargo-handling facilities at its busiest port.
 *  - Relations with the player drift toward neutral, drop when the player works the rival's
 *    home port, and can be raised with courtesies or a partnership.
 *
 * Everything here is deterministic given the save's seed and simulated time, so rivals
 * behave the same on every device a save is opened on.
 */

const DAY = 86_400;
const HOUR = 3_600;

interface Personality {
  take_chance: number;
  max_ships: number;
  buy_threshold: number;
  range_factor: number;
  turnaround_hours: [number, number];
  development_days: number;
  treasury_factor: number;
}

const PERSONALITIES: Record<RivalDefinition["personality"], Personality> = {
  expansive: { take_chance: 0.8, max_ships: 8, buy_threshold: 1.3, range_factor: 1.3, turnaround_hours: [10, 24], development_days: 60, treasury_factor: 1.2 },
  steady: { take_chance: 0.6, max_ships: 6, buy_threshold: 1.7, range_factor: 1.0, turnaround_hours: [14, 36], development_days: 90, treasury_factor: 1.0 },
  cautious: { take_chance: 0.4, max_ships: 4, buy_threshold: 2.2, range_factor: 0.6, turnaround_hours: [18, 48], development_days: 120, treasury_factor: 0.8 },
};

const MODERN_NAMES = ["Aurora", "Meridian", "Orion", "Vega", "Caspian", "Halcyon", "Solstice", "Kestrel", "Boreal", "Zenith", "Corsair", "Tempest"];
const HISTORICAL_NAMES = ["Safina", "Mubarak", "Nur", "Barakah", "Sa'ada", "Rahmah", "Amanah", "Salamah", "Fatah", "Ghanimah", "Hidayah", "Nasr"];

export const RIVAL_SHIP_PREFIX = "rival:";

export function isRivalAssigned(contract: Contract): boolean {
  return contract.assigned_ship_id?.startsWith(RIVAL_SHIP_PREFIX) ?? false;
}

export function rivalDefinition(catalog: ScenarioCatalog, rivalId: string): RivalDefinition | undefined {
  return catalog.scenario.rivals.find((r) => r.id === rivalId);
}

function requireClass(catalog: ScenarioCatalog, id: string): VesselClass {
  const cls = catalog.ships.find((c) => c.id === id);
  if (!cls) throw new Error(`Unknown vessel class ${id}`);
  return cls;
}

/** Whether a rival's ships may call at a port: its own polity's ports, or ports open to all. */
export function rivalCanCall(def: RivalDefinition, port: PortRecord): boolean {
  if (port.id === def.home_port_id) return true;
  if (def.polity_id && port.polity_id === def.polity_id) return true;
  return port.default_access === "open" || port.default_access === "agreement";
}

function shipName(catalog: ScenarioCatalog, def: RivalDefinition, index: number, seed: number): string {
  const pool = catalog.scenario.mode === "modern" ? MODERN_NAMES : HISTORICAL_NAMES;
  const rng = createRandom(`${seed}:rivalname:${def.id}`);
  const offset = Math.floor(rng.next() * pool.length);
  const base = pool[(offset + index) % pool.length]!;
  const initials = def.name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return catalog.scenario.mode === "modern" ? `MV ${base} ${initials || "R"}` : `${base} ${index + 1}`;
}

function makeShip(catalog: ScenarioCatalog, def: RivalDefinition, index: number, seed: number, simSeconds: number): RivalShip {
  const cls = requireClass(catalog, def.ship_class_ids[index % def.ship_class_ids.length]!);
  const port = catalog.portMap.get(def.home_port_id);
  if (!port) throw new Error(`Rival ${def.id} has an unknown home port ${def.home_port_id}`);
  const p = PERSONALITIES[def.personality];
  const rng = createRandom(`${seed}:rivalship:${def.id}:${index}`);
  return {
    id: `${def.id}_${index + 1}`,
    class_id: cls.id,
    name: shipName(catalog, def, index, seed),
    position: { lat: port.latitude, lon: port.longitude },
    heading: 90,
    speed_knots: 0,
    status: "docked",
    docked_port_id: port.id,
    route: [],
    waypoint_index: 0,
    leg_progress_nm: 0,
    destination_port_id: null,
    origin_port_id: null,
    contract_id: null,
    voyage_value: 0,
    // Stagger first departures so the rivals do not all leave at once.
    next_decision_sim_seconds: simSeconds + rng.range(p.turnaround_hours[0], p.turnaround_hours[1] * 2) * HOUR,
    total_distance_nm: 0,
  };
}

export function createRivalStates(catalog: ScenarioCatalog, seed: number, simSeconds: number): Record<string, RivalState> {
  const rivals: Record<string, RivalState> = {};
  for (const def of catalog.scenario.rivals) {
    const ships: Record<string, RivalShip> = {};
    for (let i = 0; i < def.starting_ships; i++) {
      const ship = makeShip(catalog, def, i, seed, simSeconds);
      ships[ship.id] = ship;
    }
    rivals[def.id] = {
      id: def.id,
      treasury: Math.round(catalog.scenario.initial_treasury * PERSONALITIES[def.personality].treasury_factor),
      ships,
      port_calls: {},
      developed: {},
      relation: 50,
      partnership: false,
      last_relation_action_sim_seconds: null,
      last_purchase_sim_seconds: simSeconds,
      last_development_sim_seconds: simSeconds,
      stats: { deliveries: 0, contracts_taken: 0, revenue: 0 },
    };
  }
  return rivals;
}

export type RivalEvent = { type: "rival_contract_taken"; rival_id: string; contract: Contract; port_id: string } | { type: "rival_partnership_ended"; rival_id: string };

/** Value of an own-account voyage, priced like a contract for a full hold. */
function ownAccountValue(catalog: ScenarioCatalog, state: GameState, cls: VesselClass, origin: PortRecord, destination: PortRecord): number {
  const supplies = origin.supplies.map((id) => catalog.goodMap.get(id)).filter((g): g is NonNullable<typeof g> => !!g);
  if (supplies.length === 0) return 0;
  const good = supplies.find((g) => destination.demands.includes(g.id)) ?? supplies[0]!;
  const ctx: ContractContext = { catalog, state, fleet_capacity: cls.cargo_capacity, payment_multiplier: 1, extra_contracts: 0, event_price_mods: {}, year: state.date.year };
  const c = buildContract(ctx, origin, destination, good, 0.7, 1, "rival_tmp", null, false);
  return c ? c.payment : 0;
}

function voyageExpenses(catalog: ScenarioCatalog, cls: VesselClass, distanceNmTotal: number, destination: PortRecord): number {
  const fuel = estimateEndurance(cls, distanceNmTotal) * catalog.scenario.fuel_price_per_unit;
  const fees = catalog.scenario.base_port_fee * destination.fee_modifier * Math.max(0.5, cls.cargo_capacity / Math.max(1, Math.min(...catalog.ships.map((s) => s.cargo_capacity))));
  return Math.round(fuel + fees);
}

function routeLength(route: RivalShip["route"]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += distanceNm(route[i - 1] as GeoPoint, route[i] as GeoPoint);
  return total;
}

function decide(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState, ship: RivalShip, contracts: Record<string, Contract>, events: RivalEvent[]): { ship: RivalShip; rival: RivalState } {
  const here = ship.docked_port_id ? catalog.portMap.get(ship.docked_port_id) : undefined;
  if (!here) return { ship, rival };
  const cls = requireClass(catalog, ship.class_id);
  const p = PERSONALITIES[def.personality];
  const rng = createRandom(`${state.seed}:rival:${def.id}:${ship.id}:${Math.floor(state.sim_seconds / HOUR)}`);
  const year = state.date.year;
  const atPlayerHome = here.id === state.empire.home_port_id;

  // 1. A contract from the shared board.
  if (!(rival.partnership && atPlayerHome)) {
    const candidates = Object.values(contracts).filter((c) => {
      if (c.status !== "available" || c.mission || c.origin_port_id !== here.id) return false;
      const dest = catalog.portMap.get(c.destination_port_id);
      if (!dest || !rivalCanCall(def, dest)) return false;
      const good = catalog.goodMap.get(c.good_id);
      return c.quantity * (good?.cargo_space ?? 1) <= cls.cargo_capacity;
    });
    if (candidates.length > 0 && rng.next() < p.take_chance) {
      const score = (c: Contract) => (def.personality === "expansive" ? c.payment : def.personality === "steady" ? (c.payment - c.estimated_costs) / Math.max(50, c.distance_nm) : -c.distance_nm);
      const chosen = candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
      const dest = catalog.portMap.get(chosen.destination_port_id)!;
      const planned = planRoute(here, dest, year);
      if (planned) {
        contracts[chosen.id] = { ...chosen, status: "in_transit", assigned_ship_id: `${RIVAL_SHIP_PREFIX}${def.id}:${ship.id}` };
        events.push({ type: "rival_contract_taken", rival_id: def.id, contract: contracts[chosen.id]!, port_id: here.id });
        const sailing: RivalShip = { ...ship, status: "sailing", docked_port_id: null, route: planned.waypoints, waypoint_index: 1, leg_progress_nm: 0, origin_port_id: here.id, destination_port_id: dest.id, contract_id: chosen.id, voyage_value: 0, speed_knots: cruiseSpeed(cls), heading: initialBearing(ship.position, (planned.waypoints[1] as GeoPoint | undefined) ?? { lat: dest.latitude, lon: dest.longitude }) };
        return { ship: sailing, rival: { ...rival, stats: { ...rival.stats, contracts_taken: rival.stats.contracts_taken + 1 } } };
      }
    }
  }

  // 2. Own-account trading to a port that wants what this one supplies.
  const range = (catalog.scenario.mode === "modern" ? 3200 : 1500) * p.range_factor;
  const home = catalog.portMap.get(def.home_port_id);
  const pool = catalog.ports
    .filter((port) => port.id !== here.id && rivalCanCall(def, port))
    .map((port) => {
      const d = distanceNm({ lat: here.latitude, lon: here.longitude }, { lat: port.latitude, lon: port.longitude });
      let weight = d <= range ? 1 : 0.08;
      if (here.supplies.some((g) => port.demands.includes(g))) weight *= 3;
      if (port.id === def.home_port_id) weight *= def.personality === "cautious" ? 2.5 : 1.3;
      if (port.size === "hub" || port.size === "major") weight *= 1.4;
      return { port, weight };
    })
    .filter((x) => x.weight > 0);
  if (pool.length === 0 || !home) return { ship: { ...ship, next_decision_sim_seconds: state.sim_seconds + DAY }, rival };

  for (let attempt = 0; attempt < 4; attempt++) {
    const total = pool.reduce((s, x) => s + x.weight, 0);
    let r = rng.next() * total;
    let pick = pool[pool.length - 1]!.port;
    for (const x of pool) {
      r -= x.weight;
      if (r <= 0) {
        pick = x.port;
        break;
      }
    }
    const planned = planRoute(here, pick, year);
    if (!planned) continue;
    const value = ownAccountValue(catalog, state, cls, here, pick);
    const sailing: RivalShip = { ...ship, status: "sailing", docked_port_id: null, route: planned.waypoints, waypoint_index: 1, leg_progress_nm: 0, origin_port_id: here.id, destination_port_id: pick.id, contract_id: null, voyage_value: value, speed_knots: cruiseSpeed(cls), heading: initialBearing(ship.position, (planned.waypoints[1] as GeoPoint | undefined) ?? { lat: pick.latitude, lon: pick.longitude }) };
    return { ship: sailing, rival };
  }
  return { ship: { ...ship, next_decision_sim_seconds: state.sim_seconds + DAY }, rival };
}

function move(catalog: ScenarioCatalog, ship: RivalShip, dtSim: number): { ship: RivalShip; arrived: boolean } {
  const cls = requireClass(catalog, ship.class_id);
  let distance = (cruiseSpeed(cls) * dtSim) / HOUR;
  let position = ship.position;
  let index = ship.waypoint_index;
  let progress = ship.leg_progress_nm;
  let heading = ship.heading;
  let sailed = 0;
  while (distance > 0 && index < ship.route.length) {
    const from = ship.route[index - 1] as GeoPoint;
    const to = ship.route[index] as GeoPoint;
    const legLength = distanceNm(from, to);
    const remaining = legLength - progress;
    heading = initialBearing(position, to);
    if (distance >= remaining) {
      distance -= remaining;
      sailed += remaining;
      position = { lat: to.lat, lon: to.lon };
      index += 1;
      progress = 0;
    } else {
      progress += distance;
      sailed += distance;
      position = legLength > 0 ? interpolate(from, to, progress / legLength) : position;
      distance = 0;
    }
  }
  const arrived = index >= ship.route.length;
  return { ship: { ...ship, position, heading, waypoint_index: index, leg_progress_nm: progress, total_distance_nm: ship.total_distance_nm + sailed }, arrived };
}

function arrive(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState, ship: RivalShip, contracts: Record<string, Contract>): { ship: RivalShip; rival: RivalState } {
  const dest = ship.destination_port_id ? catalog.portMap.get(ship.destination_port_id) : undefined;
  if (!dest) return { ship: { ...ship, status: "docked", speed_knots: 0, route: [], waypoint_index: 0 }, rival };
  const cls = requireClass(catalog, ship.class_id);
  const p = PERSONALITIES[def.personality];
  let payment = ship.voyage_value;
  if (ship.contract_id) {
    const c = contracts[ship.contract_id];
    if (c) {
      payment = c.payment;
      delete contracts[ship.contract_id];
    }
  }
  const expenses = voyageExpenses(catalog, cls, routeLength(ship.route), dest);
  const rng = createRandom(`${state.seed}:rivalturn:${def.id}:${ship.id}:${Math.floor(state.sim_seconds / HOUR)}`);
  const docked: RivalShip = {
    ...ship,
    status: "docked",
    docked_port_id: dest.id,
    position: { lat: dest.latitude, lon: dest.longitude },
    speed_knots: 0,
    route: [],
    waypoint_index: 0,
    leg_progress_nm: 0,
    contract_id: null,
    voyage_value: 0,
    origin_port_id: null,
    destination_port_id: null,
    next_decision_sim_seconds: state.sim_seconds + rng.range(p.turnaround_hours[0], p.turnaround_hours[1]) * HOUR,
  };
  const updated: RivalState = {
    ...rival,
    treasury: Math.round(rival.treasury + payment - expenses),
    port_calls: { ...rival.port_calls, [dest.id]: (rival.port_calls[dest.id] ?? 0) + 1 },
    stats: { ...rival.stats, deliveries: rival.stats.deliveries + 1, revenue: rival.stats.revenue + payment },
  };
  return { ship: docked, rival: updated };
}

function grow(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState): RivalState {
  const p = PERSONALITIES[def.personality];
  let next = rival;
  // Fleet growth.
  const fleetSize = Object.keys(next.ships).length;
  if (state.sim_seconds - next.last_purchase_sim_seconds >= 30 * DAY && fleetSize < p.max_ships) {
    const classes = def.ship_class_ids.map((id) => requireClass(catalog, id));
    const affordable = classes.filter((c) => next.treasury >= c.purchase_cost * p.buy_threshold);
    if (affordable.length > 0) {
      const cls = affordable.reduce((a, b) => (b.cargo_capacity > a.cargo_capacity ? b : a));
      const index = fleetSize;
      const ship = { ...makeShip(catalog, def, index, state.seed, state.sim_seconds), class_id: cls.id };
      next = { ...next, treasury: next.treasury - cls.purchase_cost, ships: { ...next.ships, [ship.id]: ship }, last_purchase_sim_seconds: state.sim_seconds };
    } else {
      next = { ...next, last_purchase_sim_seconds: state.sim_seconds - 20 * DAY }; // check again in ten days
    }
  }
  // Port development at the busiest port (home when nothing else).
  if (state.sim_seconds - next.last_development_sim_seconds >= p.development_days * DAY) {
    const busiest = Object.entries(next.port_calls).sort((a, b) => b[1] - a[1])[0]?.[0] ?? def.home_port_id;
    const level = next.developed[busiest] ?? 0;
    const cost = infrastructureCost(catalog, "cargo_handling", level);
    if (level < 4 && next.treasury >= cost * 3) {
      next = { ...next, treasury: next.treasury - cost, developed: { ...next.developed, [busiest]: level + 1 }, last_development_sim_seconds: state.sim_seconds };
    } else {
      next = { ...next, last_development_sim_seconds: state.sim_seconds - (p.development_days - 15) * DAY };
    }
  }
  return next;
}

/** Advance every rival by `dtSim` simulated seconds. Returns the new state and notable events. */
export function tickRivals(catalog: ScenarioCatalog, state: GameState, dtSim: number): { state: GameState; events: RivalEvent[] } {
  const events: RivalEvent[] = [];
  const ids = Object.keys(state.rivals).sort();
  if (ids.length === 0) return { state, events };
  const contracts = { ...state.contracts };
  const rivals: Record<string, RivalState> = {};

  for (const id of ids) {
    const def = rivalDefinition(catalog, id);
    let rival = state.rivals[id]!;
    if (!def) {
      rivals[id] = rival;
      continue;
    }
    const ships: Record<string, RivalShip> = {};
    let upkeep = 0;
    for (const shipId of Object.keys(rival.ships).sort()) {
      let ship = rival.ships[shipId]!;
      const cls = requireClass(catalog, ship.class_id);
      upkeep += (cls.maintenance_per_day * dtSim) / DAY;
      if (ship.status === "sailing") {
        const moved = move(catalog, ship, dtSim);
        ship = moved.ship;
        if (moved.arrived) {
          const result = arrive(catalog, state, def, rival, ship, contracts);
          ship = result.ship;
          rival = result.rival;
        }
      } else if (state.sim_seconds >= ship.next_decision_sim_seconds) {
        const result = decide(catalog, state, def, rival, ship, contracts, events);
        ship = result.ship;
        rival = result.rival;
      }
      ships[shipId] = ship;
    }
    rival = { ...rival, ships, treasury: rival.treasury - upkeep };
    rival = grow(catalog, state, def, rival);

    // Relations drift toward neutral over a couple of months; a partnership cannot survive bad standing.
    const relation = clamp(rival.relation + ((50 - rival.relation) * dtSim) / (60 * DAY), 0, 100);
    let partnership = rival.partnership;
    if (partnership && relation < 35) {
      partnership = false;
      events.push({ type: "rival_partnership_ended", rival_id: id });
    }
    rivals[id] = { ...rival, relation, partnership, treasury: Math.round(rival.treasury * 100) / 100 };
  }
  return { state: { ...state, rivals, contracts }, events };
}

/** The player accepting a contract at a rival's home port is read as poaching. */
export function noteCompetition(catalog: ScenarioCatalog, state: GameState, contract: Contract): GameState {
  let rivals = state.rivals;
  let changed = false;
  for (const def of catalog.scenario.rivals) {
    const rival = rivals[def.id];
    if (!rival || def.home_port_id !== contract.origin_port_id) continue;
    rivals = { ...rivals, [def.id]: { ...rival, relation: clamp(rival.relation - 2, 0, 100) } };
    changed = true;
  }
  return changed ? { ...state, rivals } : state;
}

export interface MarketShare {
  rival_id: string | null; // null = the player's house
  calls: number;
  share: number;
}

/** Share of recorded port calls at a port, for the player and each rival. */
export function marketShare(state: GameState, portId: string): MarketShare[] {
  const playerCalls = state.voyages.filter((v) => v.destination_port_id === portId).length;
  const rows: MarketShare[] = [{ rival_id: null, calls: playerCalls, share: 0 }];
  for (const rival of Object.values(state.rivals)) rows.push({ rival_id: rival.id, calls: rival.port_calls[portId] ?? 0, share: 0 });
  const total = rows.reduce((s, r) => s + r.calls, 0);
  for (const r of rows) r.share = total > 0 ? r.calls / total : 0;
  return rows.sort((a, b) => b.calls - a.calls);
}

/** Rival with a majority of the traffic at a port, if any (and enough calls to matter). */
export function dominantRival(state: GameState, portId: string): RivalState | null {
  const top = marketShare(state, portId)[0];
  if (!top || top.rival_id === null || top.calls < 3 || top.share < 0.5) return null;
  return state.rivals[top.rival_id] ?? null;
}

/**
 * Port fee multiplier for the player: a rival that dominates a port drives terminal charges
 * up for everyone else, while a partner's home port offers a discount.
 */
export function rivalFeeMultiplier(catalog: ScenarioCatalog, state: GameState, portId: string): number {
  let mult = 1;
  const dominant = dominantRival(state, portId);
  if (dominant && !dominant.partnership) mult *= 1.1;
  for (const def of catalog.scenario.rivals) {
    const rival = state.rivals[def.id];
    if (rival?.partnership && def.home_port_id === portId) mult *= 0.9;
  }
  return mult;
}

export type RivalAction = "courtesy" | "partnership";

/** Costs scale with the scenario's starting treasury so they are affordable from the first weeks. */
export function rivalActionCost(catalog: ScenarioCatalog, action: RivalAction): number {
  const scale = catalog.scenario.initial_treasury;
  return Math.max(1, Math.round(scale * (action === "courtesy" ? 0.02 : 0.12)));
}

export function canPerformRivalAction(catalog: ScenarioCatalog, state: GameState, rivalId: string, action: RivalAction): { ok: boolean; reason?: string } {
  const rival = state.rivals[rivalId];
  if (!rival) return { ok: false, reason: "Unknown rival." };
  if (state.treasury < rivalActionCost(catalog, action)) return { ok: false, reason: "Insufficient treasury." };
  if (action === "courtesy") {
    if (rival.last_relation_action_sim_seconds !== null && state.sim_seconds - rival.last_relation_action_sim_seconds < 30 * DAY) return { ok: false, reason: "A courtesy was extended recently; wait a month." };
  }
  if (action === "partnership") {
    if (rival.partnership) return { ok: false, reason: "A partnership is already in force." };
    if (rival.relation < 60) return { ok: false, reason: "Relations must reach 60 first." };
  }
  return { ok: true };
}

export function performRivalAction(catalog: ScenarioCatalog, state: GameState, rivalId: string, action: RivalAction): GameState {
  const check = canPerformRivalAction(catalog, state, rivalId, action);
  if (!check.ok) throw new TransactionError(check.reason ?? "Cannot do that.");
  const rival = state.rivals[rivalId]!;
  const def = rivalDefinition(catalog, rivalId);
  const name = def?.name ?? rivalId;
  const cost = rivalActionCost(catalog, action);
  const next = applyTransaction(state, -cost, "diplomacy", action === "courtesy" ? `Courtesies to ${name}` : `Partnership with ${name}`);
  const updated: RivalState = {
    ...rival,
    relation: clamp(rival.relation + (action === "courtesy" ? 8 : 10), 0, 100),
    partnership: action === "partnership" ? true : rival.partnership,
    last_relation_action_sim_seconds: state.sim_seconds,
  };
  return { ...next, rivals: { ...next.rivals, [rivalId]: updated } };
}
