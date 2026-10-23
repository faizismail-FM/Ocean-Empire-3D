import type { ScenarioCatalog } from "@/data";
import type { PortRecord, TradeGood } from "@/data/schemas";
import { createRandom } from "./rng";
import type { GameState, PortState } from "./state";

/**
 * Deterministic local markets. Each port prices each scenario good from its base price,
 * whether the port supplies or demands it, a slow seeded drift keyed to the simulated
 * week, and any active event modifiers. Values are gameplay abstractions.
 */

export function supplyDemandFactor(port: PortRecord, good: TradeGood): number {
  if (port.supplies.includes(good.id)) return 0.62;
  if (port.demands.includes(good.id)) return 1.45;
  return 1.0;
}

export function marketPrice(
  port: PortRecord,
  good: TradeGood,
  seed: number,
  simSeconds: number,
  eventMultiplier = 1,
  portState?: PortState,
): number {
  const week = Math.floor(simSeconds / (7 * 86400));
  const rng = createRandom(`${seed}:${port.id}:${good.id}:${week}`);
  const drift = 0.88 + rng.next() * 0.24; // ±12%
  const infra = portState?.infrastructure ?? {};
  const warehouseBonus = 1 + 0.04 * (infra.warehouse ?? 0) + 0.02 * (infra.commercial_district ?? 0);
  return Math.max(1, Math.round(good.base_price * supplyDemandFactor(port, good) * drift * eventMultiplier * warehouseBonus));
}

/** Quantity a port will sell per week of a good it supplies (abstraction). */
export function marketStock(port: PortRecord, good: TradeGood, seed: number, simSeconds: number): number {
  if (!port.supplies.includes(good.id)) return 0;
  const week = Math.floor(simSeconds / (7 * 86400));
  const rng = createRandom(`${seed}:stock:${port.id}:${good.id}:${week}`);
  const sizeFactor = { minor: 0.5, regional: 1, major: 1.6, hub: 2.4 }[port.size];
  const base = good.cargo_space >= 1 ? 400 : good.cargo_space >= 0.5 ? 120 : 30;
  return Math.round(base * sizeFactor * (0.7 + rng.next() * 0.6));
}

export interface MarketListing {
  good: TradeGood;
  price: number;
  stock: number;
  supplies: boolean;
  demands: boolean;
}

export function portMarket(catalog: ScenarioCatalog, state: GameState, portId: string, eventPriceMods: Record<string, number>): MarketListing[] {
  const port = catalog.portMap.get(portId);
  if (!port) return [];
  const portState = state.ports[portId];
  return catalog.goods.map((good) => ({
    good,
    price: marketPrice(port, good, state.seed, state.sim_seconds, eventPriceMods[good.id] ?? 1, portState),
    stock: marketStock(port, good, state.seed, state.sim_seconds),
    supplies: port.supplies.includes(good.id),
    demands: port.demands.includes(good.id),
  }));
}
