import type { ScenarioCatalog } from "@/data";
import type { PortRecord, TradeGood, VesselClass } from "@/data/schemas";
import { createRandom } from "./rng";
import { planRoute } from "./routing";
import { estimateEndurance, estimateVoyageSeconds } from "./ship";
import type { Contract, GameState, ShipState } from "./state";
import { marketPrice } from "./market";

/**
 * Seeded contract generation and validation. Contracts are regenerated deterministically
 * per port and simulated week, so the same save always sees the same offers.
 */

export const CONTRACT_WEEK_SECONDS = 7 * 86400;

export interface ContractContext {
  catalog: ScenarioCatalog;
  state: GameState;
  /** Largest cargo capacity among the player's ships (sets realistic quantities). */
  fleet_capacity: number;
  payment_multiplier: number;
  extra_contracts: number;
  event_price_mods: Record<string, number>;
  year: number;
}

export function contractWeekKey(portId: string, simSeconds: number): string {
  return `${portId}:${Math.floor(simSeconds / CONTRACT_WEEK_SECONDS)}`;
}

function portOpen(state: GameState, portId: string): boolean {
  const ps = state.ports[portId];
  return !!ps && ps.access !== "closed" && ps.access !== "restricted";
}

/** Generate the weekly contract offers for one origin port. */
export function generateContractsForPort(ctx: ContractContext, origin: PortRecord): Contract[] {
  const { catalog, state } = ctx;
  const weekKey = contractWeekKey(origin.id, state.sim_seconds);
  const rng = createRandom(`${state.seed}:contracts:${weekKey}`);
  const originState = state.ports[origin.id];
  const infra = originState?.infrastructure ?? {};
  const baseCount = { minor: 2, regional: 3, major: 4, hub: 5 }[origin.size];
  // A prosperous port has more cargo looking for ships; a declining one less.
  const prosperityExtra = originState && originState.population > 0 ? Math.floor(originState.prosperity / 40) - 1 : 0;
  const count = Math.max(1, baseCount + ctx.extra_contracts + (infra.warehouse ?? 0) + (infra.commercial_district ?? 0) + prosperityExtra);

  const supplies = origin.supplies.map((id) => catalog.goodMap.get(id)).filter((g): g is TradeGood => !!g);
  if (supplies.length === 0) return [];

  const destinations = catalog.ports.filter((p) => p.id !== origin.id && portOpen(state, p.id));
  const contracts: Contract[] = [];

  for (let i = 0; i < count && destinations.length > 0; i++) {
    const good = rng.pick(supplies);
    const demanding = destinations.filter((d) => d.demands.includes(good.id));
    const pool = demanding.length > 0 && rng.next() < 0.8 ? demanding : destinations;
    const destination = rng.pick(pool);
    const contract = buildContract(ctx, origin, destination, good, rng.range(0.15, 0.9), rng.range(0.9, 1.15), `ct_${weekKey.replace(/[^a-z0-9]/gi, "")}_${i}`, weekKey, false);
    if (contract) contracts.push(contract);
  }
  return contracts;
}

/** Price and schedule one contract. Returns null when no sea route exists. */
export function buildContract(
  ctx: ContractContext,
  origin: PortRecord,
  destination: PortRecord,
  good: TradeGood,
  quantityFraction: number,
  paymentJitter: number,
  id: string,
  generationKey: string | null,
  mission: boolean,
): Contract | null {
  const { catalog, state } = ctx;
  const route = planRoute(origin, destination, ctx.year);
  if (!route) return null;
  const smallest = Math.min(...catalog.ships.map((s) => s.cargo_capacity));
  const refClass = catalog.ships.reduce((a, b) => (a.cargo_capacity < b.cargo_capacity ? a : b));

  // Quantity: a fraction of the fleet's largest hold, in whole units.
  const cap = Math.max(ctx.fleet_capacity, smallest);
  const maxUnits = Math.max(1, Math.floor(cap / good.cargo_space));
  // Precious cargoes ship in smaller lots: one contract's goods are worth at most a few times the house's starting capital.
  const valueCap = Math.max(1, Math.floor((catalog.scenario.initial_treasury * 1.5) / good.base_price));
  const quantity = Math.max(1, Math.min(Math.round(maxUnits * quantityFraction), valueCap));

  const originPrice = marketPrice(origin, good, state.seed, state.sim_seconds, ctx.event_price_mods[good.id] ?? 1);
  const destPrice = marketPrice(destination, good, state.seed, state.sim_seconds, ctx.event_price_mods[good.id] ?? 1);
  const spread = Math.max(destPrice - originPrice, good.base_price * 0.25);
  // Payment grows with distance, but more slowly beyond 3,000 nm so ocean-spanning runs stay in proportion.
  const distanceFactor = 1 + Math.min(route.distance_nm, 3000) / 4000 + Math.max(0, route.distance_nm - 3000) / 12000;
  const payment = Math.round(quantity * spread * catalog.scenario.contract_margin * distanceFactor * ctx.payment_multiplier * paymentJitter + quantity * good.base_price * 0.08);

  const travel = estimateVoyageSeconds(refClass, route.distance_nm);
  const perishable = good.storage === "refrigerated" || good.storage === "perishable";
  const deadline = state.sim_seconds + travel * (perishable ? 1.6 : 2.4) + 3 * 86400;
  const fuelCost = estimateEndurance(refClass, route.distance_nm) * catalog.scenario.fuel_price_per_unit;
  const fees = catalog.scenario.base_port_fee * destination.fee_modifier;

  return {
    id,
    origin_port_id: origin.id,
    destination_port_id: destination.id,
    good_id: good.id,
    quantity,
    payment,
    estimated_costs: Math.round(fuelCost + fees),
    deadline_sim_seconds: Math.round(deadline),
    created_sim_seconds: state.sim_seconds,
    distance_nm: Math.round(route.distance_nm),
    status: "available",
    assigned_ship_id: null,
    completed_sim_seconds: null,
    paid: false,
    mission,
    generation_key: generationKey,
    charterer_id: null,
  };
}

/** The scripted first-voyage offer: a good the origin supplies and the destination wants. */
export function buildTutorialContract(ctx: ContractContext, origin: PortRecord, destination: PortRecord): Contract | null {
  const { catalog } = ctx;
  const supplies = origin.supplies.map((id) => catalog.goodMap.get(id)).filter((g): g is TradeGood => !!g);
  if (supplies.length === 0) return null;
  const good = supplies.find((g) => destination.demands.includes(g.id)) ?? supplies[0]!;
  return buildContract(ctx, origin, destination, good, 0.45, 1.05, `ct_tutorial_${origin.id}_${destination.id}`, null, true);
}

export interface ContractValidation {
  ok: boolean;
  reason?: string;
}

export function cargoUsed(ship: ShipState, catalog: ScenarioCatalog): number {
  return ship.cargo.reduce((sum, c) => sum + c.quantity * (catalog.goodMap.get(c.good_id)?.cargo_space ?? 1), 0);
}

export function cargoCapacity(cls: VesselClass, cargoMultiplier = 1): number {
  return Math.floor(cls.cargo_capacity * cargoMultiplier);
}

/** Can this ship accept and load this contract right now? */
export function validateAccept(catalog: ScenarioCatalog, state: GameState, contract: Contract, ship: ShipState, cls: VesselClass, cargoMultiplier = 1): ContractValidation {
  if (contract.status !== "available") return { ok: false, reason: "Contract is no longer available." };
  if (ship.status !== "docked" || ship.docked_port_id !== contract.origin_port_id) return { ok: false, reason: "The ship must be docked at the contract's origin port." };
  if (!portOpen(state, contract.destination_port_id)) return { ok: false, reason: "The destination port is not accessible." };
  if (state.sim_seconds > contract.deadline_sim_seconds) return { ok: false, reason: "The deadline has already passed." };
  const good = catalog.goodMap.get(contract.good_id);
  if (!good) return { ok: false, reason: "Unknown cargo." };
  const needed = contract.quantity * good.cargo_space;
  const free = cargoCapacity(cls, cargoMultiplier) - cargoUsed(ship, catalog);
  if (needed > free + 1e-6) return { ok: false, reason: `Not enough cargo space: needs ${Math.ceil(needed)} of ${Math.floor(free)} free.` };
  const originPort = catalog.portMap.get(contract.origin_port_id);
  const destPort = catalog.portMap.get(contract.destination_port_id);
  if (!originPort || !destPort) return { ok: false, reason: "Unknown port." };
  const year = state.date.year;
  if (!planRoute(originPort, destPort, year)) return { ok: false, reason: "No sea route between these ports." };
  return { ok: true };
}
