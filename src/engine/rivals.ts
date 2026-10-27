import type { ScenarioCatalog } from "@/data";
import type { HistoricalEvent, PortRecord, RivalDefinition, VesselClass } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { buildContract, type ContractContext } from "./contracts";
import { applyTransaction, TransactionError } from "./economy";
import { distanceNm, initialBearing, interpolate, type GeoPoint } from "./geo";
import { livePrice, liveStock, recordTrade } from "./market";
import { computeModifiers } from "./modifiers";
import { infrastructureCost } from "./portdev";
import { createRandom } from "./rng";
import { planRoute, planRouteFromPosition } from "./routing";
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

/**
 * Whether a rival's ships may call at a port: its own polity's ports, or ports open to all.
 * The live port state wins over the reference data, so a port closed by a historical
 * event (a sack, a maritime ban) is closed to rivals as well.
 */
export function rivalCanCall(def: RivalDefinition, port: PortRecord, state?: GameState): boolean {
  const live = state?.ports[port.id]?.access;
  if (live === "closed") return false;
  if (port.id === def.home_port_id) return true;
  if (def.polity_id && port.polity_id === def.polity_id) return true;
  if (live === "restricted") return false;
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
    cargo: null,
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
      stats: { deliveries: 0, contracts_taken: 0, revenue: 0, charters_posted: 0, goods_sold: 0 },
      relations: {},
      allies: [],
      last_charter_sim_seconds: simSeconds,
      event_log: [],
    };
  }
  return rivals;
}

export type RivalEvent =
  | { type: "rival_contract_taken"; rival_id: string; contract: Contract; port_id: string }
  | { type: "rival_partnership_ended"; rival_id: string }
  | { type: "rival_charter_posted"; rival_id: string; contract: Contract; port_id: string }
  | { type: "rival_alliance"; rival_ids: [string, string]; formed: boolean };

/** Money and goodwill owed between rivals, settled at the end of a tick. */
interface Settlement {
  payer: string;
  /** Who receives the money; null when it was already credited to the carrier on arrival. */
  payee: string | null;
  /** The rival whose ship made the delivery. */
  carrier: string;
  amount: number;
  /** Relation change applied to both parties. */
  goodwill: number;
}

const ALLY_THRESHOLD = 70;
const ALLY_BREAK = 40;

/** Standing between two rivals (50 when they have had no dealings). */
export function rivalRelation(state: GameState, a: string, b: string): number {
  return state.rivals[a]?.relations[b] ?? 50;
}

function voyageExpenses(catalog: ScenarioCatalog, state: GameState, cls: VesselClass, distanceNmTotal: number, destination: PortRecord): number {
  const fuel = estimateEndurance(cls, distanceNmTotal) * catalog.scenario.fuel_price_per_unit;
  const eventFees = state.ports[destination.id]?.fee_multiplier ?? 1;
  const fees = catalog.scenario.base_port_fee * destination.fee_modifier * eventFees * Math.max(0.5, cls.cargo_capacity / Math.max(1, Math.min(...catalog.ships.map((s) => s.cargo_capacity))));
  return Math.round(fuel + fees);
}

function routeLength(route: RivalShip["route"]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += distanceNm(route[i - 1] as GeoPoint, route[i] as GeoPoint);
  return total;
}

function decide(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState, ship: RivalShip, contracts: Record<string, Contract>, events: RivalEvent[], market: { current: GameState["market"] }): { ship: RivalShip; rival: RivalState } {
  const here = ship.docked_port_id ? catalog.portMap.get(ship.docked_port_id) : undefined;
  if (!here) return { ship, rival };
  const cls = requireClass(catalog, ship.class_id);
  const p = PERSONALITIES[def.personality];
  const rng = createRandom(`${state.seed}:rival:${def.id}:${ship.id}:${Math.floor(state.sim_seconds / HOUR)}`);
  const year = state.date.year;
  const atPlayerHome = here.id === state.empire.home_port_id;

  // 1. A contract from the shared board.
  if (!(rival.partnership && atPlayerHome)) {
    // An ally's home port is off limits, except for the ally's own charters.
    const allyHome = catalog.scenario.rivals.find((r) => rival.allies.includes(r.id) && r.home_port_id === here.id)?.id ?? null;
    const candidates = Object.values(contracts).filter((c) => {
      if (c.status !== "available" || c.mission || c.origin_port_id !== here.id) return false;
      if (c.charterer_id === def.id) return false; // never carries its own charter
      if (allyHome && c.charterer_id !== allyHome) return false;
      const dest = catalog.portMap.get(c.destination_port_id);
      if (!dest || !rivalCanCall(def, dest, state)) return false;
      const good = catalog.goodMap.get(c.good_id);
      return c.quantity * (good?.cargo_space ?? 1) <= cls.cargo_capacity;
    });
    if (candidates.length > 0 && rng.next() < p.take_chance) {
      const score = (c: Contract) => (def.personality === "expansive" ? c.payment : def.personality === "steady" ? (c.payment - c.estimated_costs) / Math.max(50, c.distance_nm) : -c.distance_nm);
      // Allies' charters come first; otherwise the personality decides.
      const preferred = candidates.filter((c) => c.charterer_id && rival.allies.includes(c.charterer_id));
      const chosen = (preferred.length > 0 ? preferred : candidates).reduce((a, b) => (score(b) > score(a) ? b : a));
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

  // 2. Own-account trading: buy at this port's market what sells best elsewhere.
  const range = (catalog.scenario.mode === "modern" ? 3200 : 1500) * p.range_factor;
  const home = catalog.portMap.get(def.home_port_id);
  const priceMods = computeModifiers(catalog, state).event_price_mods;
  const live = { ...state, market: market.current };
  const pool = catalog.ports
    .filter((port) => port.id !== here.id && rivalCanCall(def, port, state))
    .map((port) => {
      const d = distanceNm({ lat: here.latitude, lon: here.longitude }, { lat: port.latitude, lon: port.longitude });
      let weight = d <= range ? 1 : 0.08;
      if (here.supplies.some((g) => port.demands.includes(g))) weight *= 3;
      if (port.id === def.home_port_id) weight *= def.personality === "cautious" ? 2.5 : 1.3;
      if (port.size === "hub" || port.size === "major") weight *= 1.4;
      // Historical events: steer away from ports whose fees an event has driven up, and
      // toward ports supplying goods whose price an event has lifted.
      const eventFees = state.ports[port.id]?.fee_multiplier ?? 1;
      if (eventFees >= 1.5) weight *= 0.3;
      const boom = Math.max(1, ...port.supplies.map((g) => priceMods[g] ?? 1));
      if (boom > 1) weight *= 1 + (boom - 1) * 2;
      return { port, weight };
    })
    .filter((x) => x.weight > 0);
  if (pool.length === 0 || !home) return { ship: { ...ship, next_decision_sim_seconds: state.sim_seconds + DAY }, rival };

  // Real goods: every (good, destination) pair is priced from the live markets, with this
  // week's purchases and sales by everyone already weighing on stock and price.
  const budget = Math.max(0, rival.treasury) * (def.personality === "cautious" ? 0.4 : 0.6);
  type Deal = { good: (typeof catalog.goods)[number]; port: PortRecord; quantity: number; buyPrice: number; profit: number; score: number };
  const deals: Deal[] = [];
  for (const goodId of here.supplies) {
    const good = catalog.goodMap.get(goodId);
    if (!good) continue;
    const available = liveStock(here, good, live);
    if (available < 1) continue;
    const buyPrice = livePrice(here, good, live, priceMods[good.id] ?? 1);
    const quantity = Math.min(available, Math.floor(cls.cargo_capacity / good.cargo_space), Math.floor(budget / Math.max(1, buyPrice)));
    if (quantity < 1) continue;
    for (const { port, weight } of pool) {
      const sellPrice = livePrice(port, good, live, priceMods[good.id] ?? 1);
      const d = distanceNm({ lat: here.latitude, lon: here.longitude }, { lat: port.latitude, lon: port.longitude });
      const profit = (sellPrice - buyPrice) * quantity - voyageExpenses(catalog, state, cls, d * 1.15, port);
      if (profit <= 0) continue;
      const metric = def.personality === "expansive" ? profit : profit / Math.max(50, d);
      deals.push({ good, port, quantity, buyPrice, profit, score: metric * weight });
    }
  }
  deals.sort((a, b) => b.score - a.score);
  for (const deal of deals.slice(0, 3)) {
    const planned = planRoute(here, deal.port, year);
    if (!planned) continue;
    const cost = deal.buyPrice * deal.quantity;
    market.current = recordTrade(market.current, here.id, deal.good.id, state.sim_seconds, "bought", deal.quantity, deal.buyPrice);
    const sailing: RivalShip = {
      ...ship,
      status: "sailing",
      docked_port_id: null,
      route: planned.waypoints,
      waypoint_index: 1,
      leg_progress_nm: 0,
      origin_port_id: here.id,
      destination_port_id: deal.port.id,
      contract_id: null,
      voyage_value: 0,
      cargo: { good_id: deal.good.id, quantity: deal.quantity, bought_at: deal.buyPrice },
      speed_knots: cruiseSpeed(cls),
      heading: initialBearing(ship.position, (planned.waypoints[1] as GeoPoint | undefined) ?? { lat: deal.port.latitude, lon: deal.port.longitude }),
    };
    return { ship: sailing, rival: { ...rival, treasury: rival.treasury - cost } };
  }

  // 3. Nothing worth buying here: reposition in ballast toward a port with better prospects.
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
    const sailing: RivalShip = { ...ship, status: "sailing", docked_port_id: null, route: planned.waypoints, waypoint_index: 1, leg_progress_nm: 0, origin_port_id: here.id, destination_port_id: pick.id, contract_id: null, voyage_value: 0, cargo: null, speed_knots: cruiseSpeed(cls), heading: initialBearing(ship.position, (planned.waypoints[1] as GeoPoint | undefined) ?? { lat: pick.latitude, lon: pick.longitude }) };
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

function arrive(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState, ship: RivalShip, contracts: Record<string, Contract>, settlements: Settlement[], market: { current: GameState["market"] }): { ship: RivalShip; rival: RivalState } {
  const dest = ship.destination_port_id ? catalog.portMap.get(ship.destination_port_id) : undefined;
  if (!dest) return { ship: { ...ship, status: "docked", speed_knots: 0, route: [], waypoint_index: 0 }, rival };
  const cls = requireClass(catalog, ship.class_id);
  const p = PERSONALITIES[def.personality];
  let payment = ship.voyage_value;
  let goodsSold = 0;
  if (ship.cargo) {
    // Sell into the destination market at the live price; the sale weighs on that price for the week.
    const good = catalog.goodMap.get(ship.cargo.good_id);
    if (good) {
      const live = { ...state, market: market.current };
      const price = livePrice(dest, good, live, computeModifiers(catalog, state).event_price_mods[good.id] ?? 1);
      payment += price * ship.cargo.quantity;
      goodsSold = ship.cargo.quantity;
      market.current = recordTrade(market.current, dest.id, good.id, state.sim_seconds, "sold", ship.cargo.quantity, price);
    }
  }
  if (ship.contract_id) {
    const c = contracts[ship.contract_id];
    if (c) {
      payment = c.payment;
      // A charter is paid by the rival that posted it, and carrying it builds goodwill.
      if (c.charterer_id && c.charterer_id !== def.id && state.rivals[c.charterer_id]) settlements.push({ payer: c.charterer_id, payee: null, carrier: def.id, amount: payment, goodwill: 3 });
      delete contracts[ship.contract_id];
    }
  }
  let expenses = voyageExpenses(catalog, state, cls, routeLength(ship.route), dest);
  // Calling at another rival's home port means paying its agents: trade between the two.
  const host = catalog.scenario.rivals.find((r) => r.id !== def.id && r.home_port_id === dest.id);
  if (host && state.rivals[host.id] && payment > 0) {
    const handling = Math.round(payment * 0.05);
    expenses += handling;
    settlements.push({ payer: def.id, payee: host.id, carrier: def.id, amount: handling, goodwill: 1 });
  }
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
    cargo: null,
    origin_port_id: null,
    destination_port_id: null,
    next_decision_sim_seconds: state.sim_seconds + rng.range(p.turnaround_hours[0], p.turnaround_hours[1]) * HOUR,
  };
  const updated: RivalState = {
    ...rival,
    treasury: Math.round(rival.treasury + payment - expenses),
    port_calls: { ...rival.port_calls, [dest.id]: (rival.port_calls[dest.id] ?? 0) + 1 },
    stats: { ...rival.stats, deliveries: rival.stats.deliveries + 1, revenue: rival.stats.revenue + payment, goods_sold: rival.stats.goods_sold + goodsSold },
  };
  return { ship: docked, rival: updated };
}

/**
 * Rivals are shippers as well as carriers: every so often one posts a charter at its home
 * port (or its busiest port) that any other carrier, the player included, may take. The
 * charterer pays on delivery.
 */
function postCharter(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, rival: RivalState, contracts: Record<string, Contract>, events: RivalEvent[]): RivalState {
  const interval = { expansive: 10, steady: 14, cautious: 21 }[def.personality] * DAY;
  if (state.sim_seconds - rival.last_charter_sim_seconds < interval) return rival;
  const rng = createRandom(`${state.seed}:charter:${def.id}:${Math.floor(state.sim_seconds / DAY)}`);
  const busiest = Object.entries(rival.port_calls).sort((a, b) => b[1] - a[1])[0]?.[0];
  const originId = busiest && rng.next() < 0.4 ? busiest : def.home_port_id;
  const origin = catalog.portMap.get(originId);
  if (!origin) return rival;
  const supplies = origin.supplies.map((id) => catalog.goodMap.get(id)).filter((g): g is NonNullable<typeof g> => !!g);
  const openToAll = (port: PortRecord) => {
    const live = state.ports[port.id]?.access;
    return live === "open" || live === "home" || live === "agreement";
  };
  const destinations = catalog.ports.filter((port) => port.id !== origin.id && openToAll(port) && rivalCanCall(def, port, state));
  if (supplies.length === 0 || destinations.length === 0) return { ...rival, last_charter_sim_seconds: state.sim_seconds };
  const good = rng.pick(supplies);
  const wanting = destinations.filter((d) => d.demands.includes(good.id));
  const destination = rng.pick(wanting.length > 0 ? wanting : destinations);
  const capacity = Math.max(...def.ship_class_ids.map((id) => requireClass(catalog, id).cargo_capacity));
  const ctx: ContractContext = { catalog, state, fleet_capacity: capacity, payment_multiplier: 1.1, extra_contracts: 0, event_price_mods: computeModifiers(catalog, state).event_price_mods, year: state.date.year };
  const id = `ct_charter_${def.id}_${Math.floor(state.sim_seconds / DAY)}`;
  const contract = buildContract(ctx, origin, destination, good, rng.range(0.3, 0.8), 1, id, null, false);
  if (!contract || contracts[id] || rival.treasury < contract.payment * 2) return { ...rival, last_charter_sim_seconds: state.sim_seconds };
  contracts[id] = { ...contract, charterer_id: def.id };
  events.push({ type: "rival_charter_posted", rival_id: def.id, contract: contracts[id]!, port_id: origin.id });
  return { ...rival, last_charter_sim_seconds: state.sim_seconds, stats: { ...rival.stats, charters_posted: rival.stats.charters_posted + 1 } };
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
  const settlements: Settlement[] = [];
  const market = { current: state.market };

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
          const result = arrive(catalog, state, def, rival, ship, contracts, settlements, market);
          ship = result.ship;
          rival = result.rival;
        }
      } else if (state.sim_seconds >= ship.next_decision_sim_seconds) {
        const result = decide(catalog, state, def, rival, ship, contracts, events, market);
        ship = result.ship;
        rival = result.rival;
      }
      ships[shipId] = ship;
    }
    rival = { ...rival, ships, treasury: rival.treasury - upkeep };
    rival = grow(catalog, state, def, rival);
    rival = postCharter(catalog, state, def, rival, contracts, events);

    // Relations drift toward neutral over a couple of months; a partnership cannot survive bad standing.
    const relation = clamp(rival.relation + ((50 - rival.relation) * dtSim) / (60 * DAY), 0, 100);
    let partnership = rival.partnership;
    if (partnership && relation < 35) {
      partnership = false;
      events.push({ type: "rival_partnership_ended", rival_id: id });
    }
    rivals[id] = { ...rival, relation, partnership, treasury: Math.round(rival.treasury * 100) / 100 };
  }

  // Settle what rivals owe each other and let their mutual standing move.
  const bump = (a: string, b: string, delta: number) => {
    const ra = rivals[a];
    if (!ra) return;
    rivals[a] = { ...ra, relations: { ...ra.relations, [b]: clamp((ra.relations[b] ?? 50) + delta, 0, 100) } };
  };
  for (const s of settlements) {
    const payer = rivals[s.payer];
    if (payer) rivals[s.payer] = { ...payer, treasury: Math.round(payer.treasury - s.amount) };
    if (s.payee && rivals[s.payee]) rivals[s.payee] = { ...rivals[s.payee]!, treasury: Math.round(rivals[s.payee]!.treasury + s.amount) };
    // Goodwill flows between payer and payee for a handling fee, and between charterer and carrier for a charter.
    const counterpart = s.payee ?? s.carrier;
    if (counterpart !== s.payer) {
      bump(s.payer, counterpart, s.goodwill);
      bump(counterpart, s.payer, s.goodwill);
    }
  }
  // Mutual standing drifts toward neutral over four months; alliances form at 70 and break below 40.
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const ra = rivals[a]!;
      const rb = rivals[b]!;
      const current = ((ra.relations[b] ?? 50) + (rb.relations[a] ?? 50)) / 2;
      const drifted = clamp(current + ((50 - current) * dtSim) / (120 * DAY), 0, 100);
      const allied = ra.allies.includes(b);
      let formed: boolean | null = null;
      if (!allied && drifted >= ALLY_THRESHOLD) formed = true;
      if (allied && drifted < ALLY_BREAK) formed = false;
      const alliesA = formed === true ? [...ra.allies, b] : formed === false ? ra.allies.filter((x) => x !== b) : ra.allies;
      const alliesB = formed === true ? [...rb.allies, a] : formed === false ? rb.allies.filter((x) => x !== a) : rb.allies;
      rivals[a] = { ...ra, relations: { ...ra.relations, [b]: drifted }, allies: alliesA };
      rivals[b] = { ...rb, relations: { ...rb.relations, [a]: drifted }, allies: alliesB };
      if (formed !== null) events.push({ type: "rival_alliance", rival_ids: [a, b], formed });
    }
  }
  return { state: { ...state, rivals, contracts, market: market.current }, events };
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

function nearestCallablePort(catalog: ScenarioCatalog, state: GameState, def: RivalDefinition, from: GeoPoint, exclude: string): PortRecord | null {
  let best: PortRecord | null = null;
  let bestD = Infinity;
  for (const port of catalog.ports) {
    if (port.id === exclude || !rivalCanCall(def, port, state)) continue;
    const d = distanceNm(from, { lat: port.latitude, lon: port.longitude });
    if (d < bestD) {
      bestD = d;
      best = port;
    }
  }
  return best;
}

function logReaction(rival: RivalState, eventId: string, simSeconds: number, note: string): RivalState {
  return { ...rival, event_log: [{ event_id: eventId, sim_seconds: simSeconds, note }, ...rival.event_log].slice(0, 12) };
}

/**
 * How rivals answer a historical event once its effects have been applied to the state.
 * Reactions derive from the event's gameplay effects, so any event works:
 *  - a port closed or restricted: ships bound there divert to the nearest port they may
 *    still call at (dropping any contract), and a rival based there loses part of its
 *    treasury to the disruption;
 *  - a port whose fees an event raises: ships bound there with no contract turn back to
 *    the nearest cheaper port, and a rival based there is squeezed;
 *  - a good whose price an event lifts: rivals' route choices favour its suppliers
 *    (applied in `decide`), noted here for the log;
 *  - a relations change for a rival's own polity: the rival's standing with the player
 *    moves half as far in the same direction.
 * Returns the new state and one short note per rival that did something.
 */
export function reactToEvent(catalog: ScenarioCatalog, state: GameState, event: HistoricalEvent): { state: GameState; notes: string[] } {
  const notes: string[] = [];
  if (Object.keys(state.rivals).length === 0 || event.effects.length === 0) return { state, notes };
  const contracts = { ...state.contracts };
  const rivals: Record<string, RivalState> = {};
  const year = state.date.year;

  for (const def of catalog.scenario.rivals) {
    let rival = state.rivals[def.id];
    if (!rival) continue;
    const parts: string[] = [];
    let treasuryHit = 0;
    const ships: Record<string, RivalShip> = { ...rival.ships };

    for (const effect of event.effects) {
      if (effect.type === "port_access" || effect.type === "port_fee_modifier") {
        const port = catalog.portMap.get(effect.port_id);
        if (!port) continue;
        const closed = effect.type === "port_access" && !rivalCanCall(def, port, state);
        const expensive = effect.type === "port_fee_modifier" && effect.multiplier >= 1.5;
        if (!closed && !expensive) continue;
        // Divert ships bound for the port.
        let diverted = 0;
        for (const ship of Object.values(ships)) {
          if (ship.status !== "sailing" || ship.destination_port_id !== port.id) continue;
          if (expensive && ship.contract_id) continue; // a paid contract is still worth delivering
          const alt = nearestCallablePort(catalog, state, def, ship.position, port.id);
          if (!alt) continue;
          const planned = planRouteFromPosition(ship.position, alt, year);
          const cls = requireClass(catalog, ship.class_id);
          if (ship.contract_id && contracts[ship.contract_id]) delete contracts[ship.contract_id];
          const route = planned ? planned.waypoints : [{ lat: ship.position.lat, lon: ship.position.lon }, { lat: alt.latitude, lon: alt.longitude, port_id: alt.id, label: alt.name }];
          ships[ship.id] = { ...ship, route, waypoint_index: 1, leg_progress_nm: 0, destination_port_id: alt.id, contract_id: null, voyage_value: Math.round(ship.voyage_value * 0.5), speed_knots: cruiseSpeed(cls), heading: initialBearing(ship.position, route[1] as GeoPoint) };
          diverted += 1;
        }
        if (diverted > 0) parts.push(`${diverted === 1 ? "diverts a ship" : `diverts ${diverted} ships`} from ${port.name}`);
        // A rival based at the port is hit directly.
        if (port.id === def.home_port_id) {
          const share = closed ? 0.25 : 0.1;
          treasuryHit += Math.round(Math.max(0, rival.treasury) * share);
          parts.push(closed ? `loses trade with its home port of ${port.name} closed` : `pays dearly for its berths at ${port.name}`);
        }
      } else if (effect.type === "good_price_modifier" && effect.multiplier > 1) {
        const good = catalog.goodMap.get(effect.good_id);
        const suppliers = catalog.ports.filter((p) => p.supplies.includes(effect.good_id) && rivalCanCall(def, p, state));
        if (good && suppliers.length > 0 && def.personality !== "cautious") parts.push(`sends ships after ${good.name.toLowerCase()} now that prices have risen`);
      } else if (effect.type === "relation_change" && def.polity_id && effect.polity_id === def.polity_id) {
        const delta = Math.round(effect.delta / 2);
        if (delta !== 0) {
          rival = { ...rival, relation: clamp(rival.relation + delta, 0, 100) };
          parts.push(delta < 0 ? "grows cooler toward your house" : "warms toward your house");
        }
      }
    }

    rival = { ...rival, ships, treasury: Math.round(rival.treasury - treasuryHit) };
    if (parts.length > 0) {
      const note = `${def.name} ${parts.join(", ")}.`;
      rival = logReaction(rival, event.id, state.sim_seconds, note);
      notes.push(note);
    }
    rivals[def.id] = rival;
  }
  for (const [id, r] of Object.entries(state.rivals)) if (!rivals[id]) rivals[id] = r;
  return { state: { ...state, rivals, contracts }, notes };
}
