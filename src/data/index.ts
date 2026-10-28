import {
  CivilizationSchema,
  HistoricalEventSchema,
  HistoricalFigureSchema,
  HistoricalRouteSchema,
  HistoricalSourceSchema,
  PortRecordSchema,
  ScenarioSchema,
  SettlementRecordSchema,
  TerritorialExtentSchema,
  TechnologySchema,
  TradeGoodSchema,
  VesselClassSchema,
  type Civilization,
  type HistoricalEvent,
  type HistoricalFigure,
  type HistoricalRoute,
  type HistoricalSource,
  type PortRecord,
  type Scenario,
  type SettlementRecord,
  type Technology,
  type TerritorialExtent,
  type TradeGood,
  type VesselClass,
} from "./schemas";
import { MODERN_PORTS } from "./modern/ports";
import { MODERN_SHIPS } from "./modern/ships";
import { MODERN_GOODS } from "./modern/goods";
import { MODERN_TECHNOLOGIES } from "./modern/technologies";
import { MODERN_SCENARIO } from "./modern/scenario";
import { HISTORICAL_PORTS } from "./historical/ports";
import { HISTORICAL_SHIPS } from "./historical/ships";
import { HISTORICAL_GOODS } from "./historical/goods";
import { HISTORICAL_TECHNOLOGIES } from "./historical/technologies";
import { HISTORICAL_EVENTS } from "./historical/events";
import { HISTORICAL_FIGURES } from "./historical/figures";
import { HISTORICAL_ROUTES } from "./historical/routes";
import { CIVILIZATIONS } from "./historical/civilizations";
import { SOURCES } from "./historical/sources";
import { SETTLEMENTS, TERRITORIAL_EXTENTS } from "./historical/territories";
import { DUTCH_SCENARIO, KILWA_SCENARIO, MELAKA_SCENARIO, PORTUGAL_SCENARIO, SIRAF_SCENARIO, VENICE_SCENARIO } from "./historical/scenarios";

/**
 * The immutable reference database. Everything is validated once at module load so that
 * a malformed record fails loudly in development and tests rather than silently in play.
 */

function validateAll<I, O>(schema: { parse: (v: unknown) => O }, items: I[], label: string): O[] {
  return items.map((item) => {
    try {
      return schema.parse(item);
    } catch (err) {
      const id = (item as { id?: string }).id ?? "?";
      throw new Error(`Invalid ${label} record ${id}: ${(err as Error).message}`);
    }
  });
}

export const ALL_PORTS: PortRecord[] = validateAll(PortRecordSchema, [...MODERN_PORTS, ...HISTORICAL_PORTS], "port");
export const ALL_SHIPS: VesselClass[] = validateAll(VesselClassSchema, [...MODERN_SHIPS, ...HISTORICAL_SHIPS], "vessel");
export const ALL_GOODS: TradeGood[] = validateAll(TradeGoodSchema, [...MODERN_GOODS, ...HISTORICAL_GOODS], "good");
export const ALL_TECHNOLOGIES: Technology[] = validateAll(TechnologySchema, [...MODERN_TECHNOLOGIES, ...HISTORICAL_TECHNOLOGIES], "technology");
export const ALL_EVENTS: HistoricalEvent[] = validateAll(HistoricalEventSchema, HISTORICAL_EVENTS, "event");
export const ALL_FIGURES: HistoricalFigure[] = validateAll(HistoricalFigureSchema, HISTORICAL_FIGURES, "figure");
export const ALL_ROUTES: HistoricalRoute[] = validateAll(HistoricalRouteSchema, HISTORICAL_ROUTES, "route");
export const ALL_CIVILIZATIONS: Civilization[] = validateAll(CivilizationSchema, CIVILIZATIONS, "civilization");
export const ALL_SOURCES: HistoricalSource[] = validateAll(HistoricalSourceSchema, SOURCES, "source");
export const ALL_EXTENTS: TerritorialExtent[] = validateAll(TerritorialExtentSchema, TERRITORIAL_EXTENTS, "territorial extent");
export const ALL_SETTLEMENTS: SettlementRecord[] = validateAll(SettlementRecordSchema, SETTLEMENTS, "settlement");
export const ALL_SCENARIOS: Scenario[] = validateAll(ScenarioSchema, [MODERN_SCENARIO, SIRAF_SCENARIO, KILWA_SCENARIO, MELAKA_SCENARIO, VENICE_SCENARIO, PORTUGAL_SCENARIO, DUTCH_SCENARIO], "scenario");

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate id ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

const portIndex = indexById(ALL_PORTS);
const shipIndex = indexById(ALL_SHIPS);
const goodIndex = indexById(ALL_GOODS);
const techIndex = indexById(ALL_TECHNOLOGIES);
const eventIndex = indexById(ALL_EVENTS);
const figureIndex = indexById(ALL_FIGURES);
const routeIndex = indexById(ALL_ROUTES);
const civIndex = indexById(ALL_CIVILIZATIONS);
const sourceIndex = indexById(ALL_SOURCES);
const scenarioIndex = indexById(ALL_SCENARIOS);

export const getPort = (id: string) => portIndex.get(id);
export const getShipClass = (id: string) => shipIndex.get(id);
export const getGood = (id: string) => goodIndex.get(id);
export const getTechnology = (id: string) => techIndex.get(id);
export const getEvent = (id: string) => eventIndex.get(id);
export const getFigure = (id: string) => figureIndex.get(id);
export const getRoute = (id: string) => routeIndex.get(id);
export const getCivilization = (id: string) => civIndex.get(id);
export const getSource = (id: string) => sourceIndex.get(id);
export const getScenario = (id: string) => scenarioIndex.get(id);

export function requirePort(id: string): PortRecord {
  const p = portIndex.get(id);
  if (!p) throw new Error(`Unknown port ${id}`);
  return p;
}
export function requireShipClass(id: string): VesselClass {
  const s = shipIndex.get(id);
  if (!s) throw new Error(`Unknown vessel class ${id}`);
  return s;
}
export function requireGood(id: string): TradeGood {
  const g = goodIndex.get(id);
  if (!g) throw new Error(`Unknown good ${id}`);
  return g;
}
export function requireScenario(id: string): Scenario {
  const s = scenarioIndex.get(id);
  if (!s) throw new Error(`Unknown scenario ${id}`);
  return s;
}

/** Everything a running game needs from the reference database, resolved for one scenario. */
export interface ScenarioCatalog {
  scenario: Scenario;
  ports: PortRecord[];
  portMap: Map<string, PortRecord>;
  ships: VesselClass[];
  goods: TradeGood[];
  goodMap: Map<string, TradeGood>;
  technologies: Technology[];
  events: HistoricalEvent[];
  routes: HistoricalRoute[];
  civilizations: Civilization[];
  /** Dated territorial control and inland settlements for the map layers. */
  extents: TerritorialExtent[];
  settlements: SettlementRecord[];
}

const catalogCache = new Map<string, ScenarioCatalog>();

export function getCatalog(scenarioId: string): ScenarioCatalog {
  const cached = catalogCache.get(scenarioId);
  if (cached) return cached;
  const scenario = requireScenario(scenarioId);
  const ports = scenario.available_ports.map(requirePort);
  const ships = scenario.ship_classes.map(requireShipClass);
  const goods = scenario.goods.map(requireGood);
  const technologies = scenario.technologies.map((id) => {
    const t = techIndex.get(id);
    if (!t) throw new Error(`Scenario ${scenarioId} references unknown technology ${id}`);
    return t;
  });
  const events = scenario.historical_events.map((id) => {
    const e = eventIndex.get(id);
    if (!e) throw new Error(`Scenario ${scenarioId} references unknown event ${id}`);
    return e;
  });
  const routes = scenario.historical_routes.map((id) => {
    const r = routeIndex.get(id);
    if (!r) throw new Error(`Scenario ${scenarioId} references unknown route ${id}`);
    return r;
  });
  const civIds = new Set<string>();
  for (const p of scenario.ai_polities) civIds.add(p.polity_id);
  for (const p of ports) if (p.polity_id) civIds.add(p.polity_id);
  const civilizations = [...civIds].map((id) => {
    const c = civIndex.get(id);
    if (!c) throw new Error(`Scenario ${scenarioId} references unknown civilization ${id}`);
    return c;
  });
  // Referential integrity for goods and lane nodes.
  for (const p of ports) {
    for (const g of [...p.supplies, ...p.demands]) {
      if (!goodIndex.has(g)) throw new Error(`Port ${p.id} references unknown good ${g}`);
    }
  }
  const extents = ALL_EXTENTS.filter((e) => e.scenario_ids.includes(scenarioId));
  const settlements = ALL_SETTLEMENTS.filter((e) => e.scenario_ids.includes(scenarioId));
  for (const e of extents) if (e.polity_id && !civIndex.has(e.polity_id)) throw new Error(`Extent ${e.id} references unknown civilization ${e.polity_id}`);
  const catalog: ScenarioCatalog = {
    scenario,
    ports,
    portMap: new Map(ports.map((p) => [p.id, p])),
    ships,
    goods,
    goodMap: new Map(goods.map((g) => [g.id, g])),
    technologies,
    events,
    routes,
    civilizations,
    extents,
    settlements,
  };
  catalogCache.set(scenarioId, catalog);
  return catalog;
}

export type { Scenario, PortRecord, VesselClass, TradeGood, Technology, HistoricalEvent, HistoricalFigure, HistoricalRoute, Civilization, HistoricalSource, TerritorialExtent, SettlementRecord };
