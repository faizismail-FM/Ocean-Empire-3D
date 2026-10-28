import { z } from "zod";

/**
 * Reference-data schemas. Everything in this file describes IMMUTABLE content: the
 * historical database, vessel catalogues, trade goods, technology trees and scenarios.
 * Mutable player state lives in `src/engine/state.ts`.
 *
 * Evidence status is attached to every historical claim so the interface can always
 * distinguish established facts, scholarly interpretation, reconstructions used to make
 * the game playable, and purely fictional gameplay additions.
 */

export const EvidenceStatusSchema = z.enum([
  "established", // widely accepted on documentary/archaeological evidence
  "scholarly_interpretation", // supported by evidence but interpreted by historians
  "reconstruction", // reasonable reconstruction made to fill a gameplay need
  "uncertain", // disputed, incomplete or unverified; needs further research
  "fictional", // gameplay invention, not a historical claim
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const EraSchema = z.enum(["ancient", "medieval", "early_modern", "industrial", "modern"]);
export type Era = z.infer<typeof EraSchema>;

export const GameModeSchema = z.enum(["historical", "modern"]);
export type GameMode = z.infer<typeof GameModeSchema>;

/** Year-based period; `approximate` marks dates that are conventional or debated. */
export const PeriodSchema = z.object({
  start: z.number().int(),
  end: z.number().int().nullable(),
  approximate: z.boolean().optional(),
  note: z.string().optional(),
});
export type Period = z.infer<typeof PeriodSchema>;

export const HistoricalSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  author_or_institution: z.string(),
  publication_year: z.number().int().nullable(),
  source_type: z.enum([
    "book",
    "journal_article",
    "primary_source",
    "museum_collection",
    "archaeological_report",
    "reference_work",
    "institution",
  ]),
  url_or_reference: z.string().nullable(),
  related_records: z.array(z.string()),
  notes: z.string().optional(),
});
export type HistoricalSource = z.infer<typeof HistoricalSourceSchema>;

export const CivilizationSchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  historical_names: z.array(z.string()),
  region: z.string(),
  start_date: z.number().int(),
  end_date: z.number().int().nullable(),
  dates_approximate: z.boolean().optional(),
  political_context: z.string(),
  description: z.string(),
  evidence_status: EvidenceStatusSchema,
  historical_sources: z.array(z.string()),
  /** Rough centre used for map labelling only. */
  map_anchor: z.object({ lat: z.number(), lon: z.number() }).optional(),
  /** Approximate influence region polygon (lon/lat pairs). Always labelled approximate. */
  approximate_region: z.array(z.tuple([z.number(), z.number()])).optional(),
  family: z.string().optional(),
  color: z.string().optional(),
});
export type Civilization = z.infer<typeof CivilizationSchema>;

export const PortInfrastructureKindSchema = z.enum([
  "docks",
  "warehouse",
  "shipyard",
  "cargo_handling",
  "navigation",
  "repair",
  "administration",
  "commercial_district",
]);
export type PortInfrastructureKind = z.infer<typeof PortInfrastructureKindSchema>;

export const PortAccessSchema = z.enum(["home", "open", "agreement", "restricted", "closed"]);
export type PortAccess = z.infer<typeof PortAccessSchema>;

/** A port as it exists in ONE period. The same place can appear once per scenario. */
export const PortRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  modern_reference_name: z.string().nullable(),
  historical_names: z.array(z.string()),
  latitude: z.number(),
  longitude: z.number(),
  location_certainty: z.enum(["precise", "approximate", "disputed"]),
  active_period: PeriodSchema,
  /** Civilization id or free text for the authority controlling the port in the scenario period. */
  historical_polity: z.string(),
  polity_id: z.string().nullable(),
  country: z.string().nullable(),
  historical_significance: z.string(),
  notes: z.string().optional(),
  /** Goods this port supplies and goods it particularly demands (ids). */
  supplies: z.array(z.string()),
  demands: z.array(z.string()),
  /** Starting infrastructure levels in the scenario. */
  infrastructure: z.partialRecord(PortInfrastructureKindSchema, z.number().int().min(0)).default({}),
  default_access: PortAccessSchema,
  fee_modifier: z.number().default(1),
  /** Sea-lane nodes this port connects to for routing. */
  lane_nodes: z.array(z.string()),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
  size: z.enum(["minor", "regional", "major", "hub"]).default("regional"),
});
export type PortRecord = z.infer<typeof PortRecordSchema>;

export const PropulsionSchema = z.enum(["sail", "engine"]);
export type Propulsion = z.infer<typeof PropulsionSchema>;

export const ShipModelSchema = z.enum(["container_feeder", "container_large", "sewn_plank", "lateen_coaster", "jong", "lancaran", "junk", "galley", "cog"]);
export type ShipModel = z.infer<typeof ShipModelSchema>;

export const VesselClassSchema = z.object({
  id: z.string(),
  name_or_class: z.string(),
  vessel_type: z.string(),
  era: EraSchema,
  civilization_or_region: z.string(),
  propulsion: PropulsionSchema,
  model: ShipModelSchema,
  length_m: z.number(),
  /** TEU for container ships; tonnes of cargo for historical hulls. */
  cargo_capacity: z.number(),
  cargo_unit: z.enum(["TEU", "t"]),
  max_speed_knots: z.number(),
  acceleration_knots_per_s: z.number(),
  deceleration_knots_per_s: z.number(),
  turn_rate_deg_per_s: z.number(),
  /** Engine ships: tonnes of fuel. Sailing ships: days of provisions. */
  endurance_capacity: z.number(),
  /** Engine ships: tonnes/day at full speed. Sailing ships: always 1 day/day; field unused. */
  consumption_per_day_at_max: z.number(),
  /** Minimum angle off the true wind at which a sailing vessel can make way (sail only). */
  min_sailing_angle_deg: z.number().optional(),
  purchase_cost: z.number(),
  maintenance_per_day: z.number(),
  crew: z.number().int(),
  required_shipyard_level: z.number().int(),
  required_technology: z.string().nullable(),
  earliest_documented_period: z.number().int().nullable(),
  latest_documented_period: z.number().int().nullable(),
  capabilities: z.string(),
  historical_notes: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
  balance_note: z.string().default("Speed, capacity and cost values are gameplay abstractions, not documented historical figures."),
});
export type VesselClass = z.infer<typeof VesselClassSchema>;

export const TradeGoodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["spice", "textile", "ceramic", "food", "timber", "metal", "luxury", "aromatic", "container", "bulk"]),
  historical_availability: PeriodSchema.nullable(),
  /** Base price per unit (gameplay abstraction). */
  base_price: z.number(),
  /** Cargo units consumed per unit (1 t or 1 TEU per unit by default). */
  cargo_space: z.number(),
  weight_t: z.number().optional(),
  storage: z.enum(["dry", "refrigerated", "liquid", "fragile", "perishable"]).default("dry"),
  trade_restrictions: z.string().optional(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type TradeGood = z.infer<typeof TradeGoodSchema>;

export const TechnologyEffectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("speed_multiplier"), value: z.number() }),
  z.object({ type: z.literal("consumption_multiplier"), value: z.number() }),
  z.object({ type: z.literal("cargo_multiplier"), value: z.number() }),
  z.object({ type: z.literal("port_fee_multiplier"), value: z.number() }),
  z.object({ type: z.literal("contract_payment_multiplier"), value: z.number() }),
  z.object({ type: z.literal("maintenance_multiplier"), value: z.number() }),
  z.object({ type: z.literal("unlock_ship"), ship_class_id: z.string() }),
  z.object({ type: z.literal("unlock_infrastructure"), infrastructure: PortInfrastructureKindSchema }),
  z.object({ type: z.literal("extra_contracts"), value: z.number().int() }),
]);
export type TechnologyEffect = z.infer<typeof TechnologyEffectSchema>;

export const TechnologySchema = z.object({
  id: z.string(),
  name: z.string(),
  branch: z.enum([
    "shipbuilding",
    "navigation",
    "cartography",
    "port_infrastructure",
    "cargo_handling",
    "commercial_administration",
    "maritime_communication",
    "vessel_efficiency",
  ]),
  cost: z.number(),
  prerequisites: z.array(z.string()),
  effects: z.array(TechnologyEffectSchema),
  description: z.string(),
  historical_notes: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type Technology = z.infer<typeof TechnologySchema>;

export const HistoricalEventEffectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("port_access"), port_id: z.string(), access: PortAccessSchema }),
  z.object({ type: z.literal("port_fee_modifier"), port_id: z.string(), multiplier: z.number() }),
  z.object({ type: z.literal("good_price_modifier"), good_id: z.string(), multiplier: z.number() }),
  z.object({ type: z.literal("relation_change"), polity_id: z.string(), delta: z.number() }),
  z.object({ type: z.literal("campaign_end"), outcome: z.enum(["victory", "defeat", "historical_end"]) }),
  z.object({ type: z.literal("notice") }),
]);
export type HistoricalEventEffect = z.infer<typeof HistoricalEventEffectSchema>;

export const HistoricalEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date_or_date_range: PeriodSchema,
  /** ISO-like trigger date used by the simulation (first day the effects apply). */
  trigger_date: z.string().nullable(),
  location: z.string(),
  involved_polities: z.array(z.string()),
  summary: z.string(),
  historical_significance: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
  /** Gameplay consequences. Always labelled as simulation, never as history. */
  effects: z.array(HistoricalEventEffectSchema).default([]),
  effects_note: z.string().optional(),
});
export type HistoricalEvent = z.infer<typeof HistoricalEventSchema>;

export const HistoricalFigureSchema = z.object({
  id: z.string(),
  name: z.string(),
  alternate_names: z.array(z.string()),
  role: z.string(),
  period: PeriodSchema,
  polity_id: z.string().nullable(),
  summary: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type HistoricalFigure = z.infer<typeof HistoricalFigureSchema>;

export const HistoricalRouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  period: PeriodSchema,
  waypoints: z.array(z.tuple([z.number(), z.number()])), // [lon, lat]
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type HistoricalRoute = z.infer<typeof HistoricalRouteSchema>;

export const ObjectiveConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("contracts_completed"), count: z.number().int() }),
  z.object({ type: z.literal("contracts_completed_with_port"), port_id: z.string(), count: z.number().int() }),
  z.object({ type: z.literal("treasury_at_least"), amount: z.number() }),
  z.object({ type: z.literal("visit_port"), port_id: z.string() }),
  z.object({ type: z.literal("infrastructure_level"), port_id: z.string(), kind: PortInfrastructureKindSchema, level: z.number().int() }),
  z.object({ type: z.literal("ships_owned"), count: z.number().int() }),
  z.object({ type: z.literal("technology_researched"), technology_id: z.string() }),
  z.object({ type: z.literal("goods_delivered"), good_id: z.string(), quantity: z.number() }),
  z.object({ type: z.literal("port_access"), port_id: z.string() }),
  z.object({ type: z.literal("ports_visited"), count: z.number().int() }),
  z.object({ type: z.literal("settlements_founded"), count: z.number().int() }),
  z.object({ type: z.literal("dependencies_held"), count: z.number().int() }),
]);
export type ObjectiveCondition = z.infer<typeof ObjectiveConditionSchema>;

export const ObjectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  condition: ObjectiveConditionSchema,
  reward: z.number().default(0),
  /** Whether the objective reflects documented history or a modified/fictional gameplay goal. */
  historical_basis: z.enum(["documented", "inspired", "fictional"]),
  basis_note: z.string().optional(),
  order: z.number().int(),
  tutorial: z.boolean().optional(),
});
export type Objective = z.infer<typeof ObjectiveSchema>;

export const CurrencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
  name: z.string(),
  note: z.string(),
});
export type Currency = z.infer<typeof CurrencySchema>;

export const StartingShipSchema = z.object({
  class_id: z.string(),
  name: z.string(),
  port_id: z.string(),
});

export const PolityRelationSchema = z.object({
  polity_id: z.string(),
  relation: z.number().min(0).max(100),
  agreements: z.array(z.enum(["trade_agreement", "port_access"])),
  note: z.string().optional(),
});
export type PolityRelation = z.infer<typeof PolityRelationSchema>;

/**
 * An AI-controlled trading power that operates its own fleet in a scenario. Rivals are
 * gameplay inventions: even where a name is inspired by a historical community, the
 * house itself, its ships and its decisions are fictional.
 */
export const RivalDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Polity whose ports count as home waters for calling rights; null for modern companies. */
  polity_id: z.string().nullable(),
  home_port_id: z.string(),
  color: z.string(),
  /** How the rival trades: expansive rivals grab the best-paying contracts and grow fast; cautious ones stay close to home. */
  personality: z.enum(["expansive", "steady", "cautious"]),
  ship_class_ids: z.array(z.string()).min(1),
  starting_ships: z.number().int().min(1),
  note: z.string(),
});
export type RivalDefinition = z.infer<typeof RivalDefinitionSchema>;

/**
 * A region groups a scenario's ports for the territory system: commercial influence is
 * tracked per port and summarised per region. Groupings are gameplay conveniences, rated
 * as reconstructions unless a source defines the grouping.
 */
export const RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  port_ids: z.array(z.string()).min(1),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type Region = z.infer<typeof RegionSchema>;

/**
 * What a player entity may do territorially in this scenario. Sovereign territory is never
 * for sale; a house may found trading settlements where the sources attest such
 * communities, and only some scenarios allow a port to be brought under its protection.
 */
export const TerritoryRulesSchema = z.object({
  summary: z.string(),
  settlements: z.boolean(),
  dependencies: z.boolean(),
  settlement_note: z.string(),
  dependency_note: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()).default([]),
});
export type TerritoryRules = z.infer<typeof TerritoryRulesSchema>;

export const COMPANY_TERRITORY_RULES: TerritoryRules = {
  summary: "A shipping company holds terminals, leases and partnerships, never sovereign territory.",
  settlements: false,
  dependencies: false,
  settlement_note: "Modern operators expand by calling at ports and leasing facilities there (see the Ports screen).",
  dependency_note: "Not applicable: ports belong to their states and port authorities.",
  evidence_status: "established",
  sources: [],
};

export const WindRegimeSchema = z.object({
  /** Month (1-12) → [direction wind comes FROM in degrees, speed in knots]. */
  monthly: z.array(z.tuple([z.number(), z.number()])).length(12),
  description: z.string(),
  evidence_status: EvidenceStatusSchema,
  sources: z.array(z.string()),
});
export type WindRegime = z.infer<typeof WindRegimeSchema>;

export const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  mode: GameModeSchema,
  era: EraSchema,
  family: z.string(),
  start_date: z.string(), // YYYY-MM-DD
  end_date: z.string(),
  campaign_length_note: z.string(),
  player_polity_id: z.string().nullable(),
  /** Whether the player entity itself is a historical polity or a fictional trading house inside one. */
  player_entity: z.enum(["historical_polity", "fictional_house_within_polity", "fictional_company"]),
  player_entity_note: z.string(),
  playable_polities: z.array(z.string()),
  ai_polities: z.array(PolityRelationSchema),
  rivals: z.array(RivalDefinitionSchema).default([]),
  /** Port groupings for the territory system; empty for scenarios without territory. */
  regions: z.array(RegionSchema).default([]),
  territory_rules: TerritoryRulesSchema.default(COMPANY_TERRITORY_RULES),
  region: z.string(),
  map_bounds: z.object({ west: z.number(), south: z.number(), east: z.number(), north: z.number() }),
  summary: z.string(),
  historical_background: z.string(),
  uncertainty_note: z.string(),
  home_port_id: z.string(),
  initial_territories: z.array(z.string()),
  available_ports: z.array(z.string()),
  ship_classes: z.array(z.string()),
  starting_ships: z.array(StartingShipSchema),
  goods: z.array(z.string()),
  technologies: z.array(z.string()),
  starting_technologies: z.array(z.string()),
  infrastructure_available: z.array(PortInfrastructureKindSchema),
  currency: CurrencySchema,
  initial_treasury: z.number(),
  difficulty_treasury_multiplier: z.record(z.enum(["easy", "normal", "hard"]), z.number()),
  objectives: z.array(ObjectiveSchema),
  historical_events: z.array(z.string()),
  historical_routes: z.array(z.string()).default([]),
  wind: WindRegimeSchema.nullable(),
  fuel_price_per_unit: z.number(),
  fuel_unit_label: z.string(),
  base_port_fee: z.number(),
  contract_margin: z.number(),
  features: z.object({
    diplomacy: z.boolean(),
    technology: z.boolean(),
    territory: z.boolean(),
    fuel: z.boolean(),
    provisions: z.boolean(),
    wind: z.boolean(),
    modern_borders: z.boolean(),
  }),
  sources: z.array(z.string()),
  evidence_status: EvidenceStatusSchema,
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const InfrastructureDefinitionSchema = z.object({
  kind: PortInfrastructureKindSchema,
  name: z.string(),
  description: z.string(),
  base_cost: z.number(),
  cost_growth: z.number(),
  max_level: z.number().int(),
  effect_summary: z.string(),
  /** Historical label variants per era for the interface. */
  era_names: z.partialRecord(EraSchema, z.string()).optional(),
});
export type InfrastructureDefinition = z.infer<typeof InfrastructureDefinitionSchema>;

/** Authoring (input) types: fields with defaults may be omitted in the data files. */
export type PortRecordInput = z.input<typeof PortRecordSchema>;
export type TradeGoodInput = z.input<typeof TradeGoodSchema>;
export type VesselClassInput = z.input<typeof VesselClassSchema>;
export type HistoricalEventInput = z.input<typeof HistoricalEventSchema>;
export type ScenarioInput = z.input<typeof ScenarioSchema>;
