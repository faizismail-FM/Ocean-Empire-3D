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
  /** Short-term effect of this week's purchases and sales at the port (see `pricePressure`). */
  pressure = 1,
): number {
  const week = Math.floor(simSeconds / (7 * 86400));
  const rng = createRandom(`${seed}:${port.id}:${good.id}:${week}`);
  const drift = 0.88 + rng.next() * 0.24; // ±12%
  const infra = portState?.infrastructure ?? {};
  const warehouseBonus = 1 + 0.04 * (infra.warehouse ?? 0) + 0.02 * (infra.commercial_district ?? 0);
  return Math.max(1, Math.round(good.base_price * supplyDemandFactor(port, good) * drift * eventMultiplier * warehouseBonus * pressure));
}

/** Weekly turnover a port of this size could handle for a good, whether or not it supplies it. */
export function marketBaseline(port: PortRecord, good: TradeGood, seed: number, simSeconds: number): number {
  const week = Math.floor(simSeconds / (7 * 86400));
  const rng = createRandom(`${seed}:stock:${port.id}:${good.id}:${week}`);
  const sizeFactor = { minor: 0.5, regional: 1, major: 1.6, hub: 2.4 }[port.size];
  const base = good.cargo_space >= 1 ? 400 : good.cargo_space >= 0.5 ? 120 : 30;
  return Math.round(base * sizeFactor * (0.7 + rng.next() * 0.6));
}

/** Quantity a port will sell per week of a good it supplies (abstraction). */
export function marketStock(port: PortRecord, good: TradeGood, seed: number, simSeconds: number): number {
  if (!port.supplies.includes(good.id)) return 0;
  return marketBaseline(port, good, seed, simSeconds);
}

/**
 * Trading by everyone (the player and the rivals) is recorded per port, good and week in
 * `state.market`, so purchases draw down the same stock and sales weigh on the same price.
 */
export function marketWeekKey(portId: string, goodId: string, simSeconds: number): string {
  return `${portId}:${goodId}:${Math.floor(simSeconds / (7 * 86400))}`;
}

export interface MarketActivity {
  bought: number;
  sold: number;
}

export function marketActivity(market: GameState["market"], portId: string, goodId: string, simSeconds: number): MarketActivity {
  const entry = market[marketWeekKey(portId, goodId, simSeconds)];
  return { bought: entry?.bought?.stock ?? 0, sold: entry?.sold?.stock ?? 0 };
}

export function recordTrade(market: GameState["market"], portId: string, goodId: string, simSeconds: number, kind: "bought" | "sold", quantity: number, price: number): GameState["market"] {
  const key = marketWeekKey(portId, goodId, simSeconds);
  const entry = market[key] ?? {};
  const prev = entry[kind];
  const stock = (prev?.stock ?? 0) + quantity;
  // Keep the quantity-weighted average price for reporting.
  const avg = prev ? Math.round((prev.price * prev.stock + price * quantity) / Math.max(1, stock)) : price;
  return { ...market, [key]: { ...entry, [kind]: { price: avg, stock } } };
}

/** Purchases this week lift the price, sales depress it, in proportion to the port's weekly turnover. */
export function pricePressure(activity: MarketActivity, baseline: number): number {
  const base = Math.max(1, baseline);
  const raw = 1 + 0.25 * (activity.bought / base) - 0.3 * (activity.sold / base);
  return Math.max(0.6, Math.min(1.5, raw));
}

/** Convenience: price at a port with this week's trading pressure applied. */
export function livePrice(port: PortRecord, good: TradeGood, state: GameState, eventMultiplier = 1): number {
  const activity = marketActivity(state.market, port.id, good.id, state.sim_seconds);
  const pressure = pricePressure(activity, marketBaseline(port, good, state.seed, state.sim_seconds));
  return marketPrice(port, good, state.seed, state.sim_seconds, eventMultiplier, state.ports[port.id], pressure);
}

/** Stock still available this week after everyone's purchases. */
export function liveStock(port: PortRecord, good: TradeGood, state: GameState): number {
  return Math.max(0, marketStock(port, good, state.seed, state.sim_seconds) - marketActivity(state.market, port.id, good.id, state.sim_seconds).bought);
}

export interface MarketListing {
  good: TradeGood;
  price: number;
  stock: number;
  supplies: boolean;
  demands: boolean;
  /** Price multiplier from this week's trading at the port (1 = none). */
  pressure: number;
  activity: MarketActivity;
}

export function portMarket(catalog: ScenarioCatalog, state: GameState, portId: string, eventPriceMods: Record<string, number>): MarketListing[] {
  const port = catalog.portMap.get(portId);
  if (!port) return [];
  return catalog.goods.map((good) => {
    const activity = marketActivity(state.market, port.id, good.id, state.sim_seconds);
    const pressure = pricePressure(activity, marketBaseline(port, good, state.seed, state.sim_seconds));
    return {
      good,
      price: marketPrice(port, good, state.seed, state.sim_seconds, eventPriceMods[good.id] ?? 1, state.ports[portId], pressure),
      stock: liveStock(port, good, state),
      supplies: port.supplies.includes(good.id),
      demands: port.demands.includes(good.id),
      pressure,
      activity,
    };
  });
}
