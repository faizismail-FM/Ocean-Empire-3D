import type { ScenarioCatalog } from "@/data";
import type { SettlementRecord, TerritorialControl, TerritorialExtent } from "@/data/schemas";
import type { GameState } from "@/engine/state";

/** Helpers for the dated map layers. Pure functions so the map and the encyclopedia agree. */

export function periodIncludes(period: { start: number; end: number | null }, year: number): boolean {
  return period.start <= year && (period.end === null || year <= period.end);
}

/** Territorial extents valid in a given year, direct control drawn last so it sits on top. */
export function extentsAt(catalog: ScenarioCatalog, year: number): TerritorialExtent[] {
  const order: Record<TerritorialControl, number> = { sphere: 0, suzerainty: 1, direct: 2, rebel: 3 };
  return catalog.extents.filter((e) => periodIncludes(e.period, year)).sort((a, b) => order[a.control] - order[b.control]);
}

export function settlementsAt(catalog: ScenarioCatalog, year: number): SettlementRecord[] {
  return catalog.settlements.filter((s) => periodIncludes(s.period, year));
}

export function formatPeriod(period: { start: number; end: number | null; approximate?: boolean }): string {
  const era = (y: number) => (y < 1600 ? `${y} CE` : `${y}`);
  const span = period.end === null ? `from ${era(period.start)}` : period.start === period.end ? era(period.start) : `${era(period.start)}–${era(period.end)}`;
  return period.approximate ? `c. ${span}` : span;
}

export const CONTROL_LABELS: Record<TerritorialControl, string> = {
  direct: "direct rule",
  suzerainty: "suzerainty or tribute",
  sphere: "sphere of commercial control",
  rebel: "rebel-held",
};

export interface NetworkEdge {
  a: string;
  b: string;
  count: number;
}

/** The player's recorded trade network: voyages aggregated by unordered port pair. */
export function tradeNetwork(state: GameState | null): NetworkEdge[] {
  if (!state) return [];
  const edges = new Map<string, NetworkEdge>();
  for (const v of state.voyages) {
    const [a, b] = v.origin_port_id < v.destination_port_id ? [v.origin_port_id, v.destination_port_id] : [v.destination_port_id, v.origin_port_id];
    if (a === b) continue;
    const key = `${a}|${b}`;
    const edge = edges.get(key) ?? { a, b, count: 0 };
    edge.count++;
    edges.set(key, edge);
  }
  return [...edges.values()].sort((x, y) => y.count - x.count);
}

/** Polity colour for the ownership layer; neutral grey for ports whose authority is not a listed polity. */
export function polityColor(catalog: ScenarioCatalog, polityId: string | null): string {
  if (!polityId) return "#9ca3af";
  return catalog.civilizations.find((c) => c.id === polityId)?.color ?? "#9ca3af";
}
