import type { ScenarioCatalog } from "@/data";
import type { Era, PortRecord } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { marketActivity } from "./market";
import type { GameState, PortState } from "./state";

/**
 * Population and prosperity, kept to the few indicators the brief asks for:
 *
 *  - population: an abstract headcount in thousands, seeded from the port's size and the
 *    period, growing while the port prospers and shrinking while it languishes;
 *  - prosperity (0..100): how well the port's trade is doing, pulled daily toward a target
 *    set by ship calls, market turnover, facilities and events;
 *  - order (0..100): public order, which recovers slowly and collapses when an event
 *    closes the port.
 *
 * They feed back into play: prosperity and population size the market's weekly stock and
 * the number and value of contracts; disorder raises port charges; building beyond the
 * basics needs a prosperous workforce; and the home port's figures shape the empire's
 * standing and its daily duties. Everything here is a gameplay abstraction.
 */

const SIZE_POPULATION: Record<PortRecord["size"], number> = { minor: 4, regional: 15, major: 45, hub: 120 };
const SIZE_PROSPERITY: Record<PortRecord["size"], number> = { minor: 38, regional: 48, major: 58, hub: 66 };
const ERA_POPULATION: Record<Era, number> = { ancient: 0.25, medieval: 0.3, early_modern: 0.4, industrial: 0.7, modern: 1 };

export interface Demographics {
  population: number;
  prosperity: number;
  order: number;
}

export function initialDemographics(port: PortRecord, era: Era): Demographics {
  return { population: Math.round(SIZE_POPULATION[port.size] * ERA_POPULATION[era] * 10) / 10, prosperity: SIZE_PROSPERITY[port.size], order: 70 };
}

/** Saves from before this system carry zeros; seed them from the port record on first use. */
export function ensureDemographics(catalog: ScenarioCatalog, state: GameState): GameState {
  let changed = false;
  const ports = { ...state.ports };
  for (const port of catalog.ports) {
    const ps = ports[port.id];
    if (!ps || ps.population > 0) continue;
    ports[port.id] = { ...ps, ...initialDemographics(port, catalog.scenario.era) };
    changed = true;
  }
  return changed ? { ...state, ports } : state;
}

/** Population relative to what a port of that size and period would normally have. */
export function populationFactor(port: PortRecord, era: Era, ps: PortState): number {
  const base = initialDemographics(port, era).population;
  return clamp(ps.population / Math.max(0.1, base), 0.5, 1.6);
}

/** Prosperity as a multiplier around 1 (0.6 at zero, 1.4 at a hundred). */
export function prosperityFactor(ps: PortState): number {
  return 0.6 + 0.8 * (ps.prosperity / 100);
}

/** Hands available for cargo work, in thousands: population tempered by public order. */
export function workforce(ps: PortState): number {
  return Math.round(ps.population * (0.3 + 0.7 * (ps.order / 100)) * 10) / 10;
}

/** Disorder makes everything at the quay slower and dearer. */
export function orderFeeMultiplier(ps: PortState): number {
  return ps.order >= 50 ? 1 : 1 + (50 - ps.order) / 200;
}

/** Facilities above the basic level need a prosperous workforce to staff them. */
export function workforceSupports(ps: PortState, nextLevel: number): boolean {
  return nextLevel <= 2 || ps.prosperity >= 40;
}

export function prosperityLabel(value: number): string {
  if (value >= 75) return "thriving";
  if (value >= 55) return "prosperous";
  if (value >= 40) return "steady";
  if (value >= 25) return "struggling";
  return "in decline";
}

export function orderLabel(value: number): string {
  if (value >= 70) return "calm";
  if (value >= 45) return "uneasy";
  if (value >= 25) return "troubled";
  return "unrest";
}

/** Ship calls at a port over the last `days` simulated days, by the player and the rivals. */
function recentCalls(state: GameState, portId: string, days: number): number {
  const since = state.sim_seconds - days * 86_400;
  let calls = state.voyages.filter((v) => v.destination_port_id === portId && v.arrived_sim_seconds >= since).length;
  // Rival calls are cumulative counts; approximate the recent share from the rolling snapshot.
  for (const rival of Object.values(state.rivals)) {
    const total = rival.port_calls[portId] ?? 0;
    const snapshot = state.ports[portId]?.rival_calls_snapshot ?? 0;
    calls += Math.max(0, total - snapshot);
  }
  return calls;
}

/** Target prosperity from the port's current circumstances. */
export function prosperityTarget(catalog: ScenarioCatalog, state: GameState, port: PortRecord): number {
  const ps = state.ports[port.id];
  if (!ps) return 50;
  if (ps.access === "closed") return 12;
  const calls = recentCalls(state, port.id, 30);
  const turnover = catalog.goods.reduce((sum, g) => {
    const a = marketActivity(state.market, port.id, g.id, state.sim_seconds);
    return sum + a.bought + a.sold;
  }, 0);
  const facilities = Object.values(ps.infrastructure).reduce((a, b) => a + b, 0);
  const rivalFacilities = Object.values(state.rivals).reduce((a, r) => a + (r.developed[port.id] ?? 0), 0);
  let target = SIZE_PROSPERITY[port.size] - 8;
  target += Math.min(24, 8 * Math.log2(1 + calls));
  target += Math.min(10, turnover / 60);
  target += 2.5 * Math.min(8, facilities + rivalFacilities);
  if (ps.fee_multiplier >= 1.5) target -= 12;
  if (ps.access === "restricted") target -= 5;
  target -= Math.max(0, 50 - ps.order) * 0.3;
  return clamp(Math.round(target), 5, 100);
}

/** Advance every port by `days` simulated days. Called from the daily block of the tick. */
export function tickDemographics(catalog: ScenarioCatalog, state: GameState, days: number): GameState {
  const ports: GameState["ports"] = { ...state.ports };
  for (const port of catalog.ports) {
    const ps = ports[port.id];
    if (!ps) continue;
    const target = prosperityTarget(catalog, { ...state, ports }, port);
    // Prosperity closes a twentieth of the gap per day; order recovers toward a level set by prosperity.
    const prosperity = clamp(ps.prosperity + (target - ps.prosperity) * (1 - Math.pow(0.95, days)), 0, 100);
    const orderTarget = ps.access === "closed" ? 25 : clamp(80 - Math.max(0, 50 - prosperity) * 0.6, 30, 90);
    const order = clamp(ps.order + (orderTarget - ps.order) * (1 - Math.pow(0.96, days)), 0, 100);
    // Population grows a tenth of a percent a day at full prosperity, and shrinks below 50.
    const growth = ((prosperity - 50) / 50) * 0.001 * days;
    const population = Math.max(0.5, Math.round(ps.population * (1 + growth) * 100) / 100);
    // Roll the rival-call snapshot forward so calls count once.
    const rivalTotal = Object.values(state.rivals).reduce((a, r) => a + (r.port_calls[port.id] ?? 0), 0);
    ports[port.id] = { ...ps, prosperity: Math.round(prosperity * 10) / 10, order: Math.round(order * 10) / 10, population, rival_calls_snapshot: rivalTotal };
  }
  return { ...state, ports };
}

/** An event that shuts a port breaks its order at once; the daily tick recovers it later. */
export function shockOrder(ps: PortState, delta: number): PortState {
  return { ...ps, order: clamp(ps.order + delta, 0, 100) };
}
