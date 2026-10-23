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
  const count = baseCount + ctx.extra_contracts + (infra.warehouse ?? 0) + (infra.commercial_district ?? 0);

  const supplies = origin.supplies.map((id) => catalog.goodMap.get(id)).filter((g): g is TradeGood => !!g);
  if (supplies.length === 0) return [];

  const destinations = catalog.ports.filter((p) => p.id !== origin.id && portOpen(state, p.id));
  const contracts: Contract[] = [];
  const smallest = Math.min(...catalog.ships.map((s) => s.cargo_capacity));
  const refClass = catalog.ships.reduce((a, b) => (a.cargo_capacity < b.cargo_capacity ? a : b));

  for (let i = 0; i < count && destinations.length > 0; i++) {
    const good = rng.pick(supplies);
    const demanding = destinations.filter((d) => d.demands.includes(good.id));
    const pool = demanding.length > 0 && rng.next() < 0.8 ? demanding : destinations;
    const destination = rng.pick(pool);
    const route = planRoute(origin, destination, ctx.year);
    if (!route) continue;

    // Quantity: between 15% and 90% of the fleet's largest hold, in whole units.
    const cap = Math.max(ctx.fleet_capacity, smallest);
    const maxUnits = Math.max(1, Math.floor(cap / good.cargo_space));
    const quantity = Math.max(1, Math.round(maxUnits * rng.range(0.15, 0.9)));

    const originPrice = marketPrice(origin, good, state.seed, state.sim_seconds, ctx.event_price_mods[good.id] ?? 1);
    const destPrice = marketPrice(destination, good, state.seed, state.sim_seconds, ctx.event_price_mods[good.id] ?? 1);
    const spread = Math.max(destPrice - originPrice, good.base_price * 0.25);
    const distanceFactor = 1 + route.distance_nm / 4000;
    const payment = Math.round(quantity * spread * catalog.scenario.contract_margin * distanceFactor * ctx.payment_multiplier * rng.range(0.9, 1.15) + quantity * good.base_price * 0.08);

    const travel = estimateVoyageSeconds(refClass, route.distance_nm);
    const perishable = good.storage === "refrigerated" || good.storage === "perishable";
    const deadline = state.sim_seconds + travel * (perishable ? 1.6 : 2.4) + 3 * 86400;
    const fuelCost = estimateEndurance(refClass, route.distance_nm) * catalog.scenario.fuel_price_per_unit;
    const fees = catalog.scenario.base_port_fee * destination.fee_modifier;

    contracts.push({
      id: `ct_${weekKey.replace(/[^a-z0-9]/gi, "")}_${i}`,
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
      mission: false,
      generation_key: weekKey,
    });
  }
  return contracts;
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
