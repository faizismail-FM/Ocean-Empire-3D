import type { ScenarioInput as Scenario } from "../schemas";
import { MODERN_PORTS } from "./ports";
import { MODERN_SHIPS } from "./ships";
import { MODERN_GOODS } from "./goods";
import { MODERN_TECHNOLOGIES } from "./technologies";

export const MODERN_SCENARIO: Scenario = {
  id: "modern_shipping_2024",
  title: "Modern Shipping Empire",
  subtitle: "Build a container line from a single feeder ship, 2024",
  mode: "modern",
  era: "modern",
  family: "Modern shipping company",
  start_date: "2024-01-08",
  end_date: "2044-01-01",
  campaign_length_note: "Open-ended company mode. Objectives mark milestones; there is no fixed end.",
  player_polity_id: null,
  player_entity: "fictional_company",
  player_entity_note: "Your company is fictional. Ports, vessel categories and trade lanes follow the real-world container shipping industry.",
  playable_polities: [],
  ai_polities: [],
  region: "Global",
  map_bounds: { west: -130, south: -45, east: 160, north: 62 },
  summary: "Start with a 1,000 TEU feeder ship at Port Klang, carry containers to Singapore, pay for fuel and terminal fees, and grow into a global container line.",
  historical_background: "Containerisation, introduced in the 1950s and standardised in the late 1960s, transformed world trade by making cargo handling fast and cheap. Today a hub-and-spoke network of transhipment ports such as Singapore, Port Klang, Rotterdam and Jebel Ali connects mainline services with regional feeders.",
  uncertainty_note: "Freight rates, fuel prices and vessel costs in the game are simplified abstractions and do not reflect any real company's finances.",
  home_port_id: "port_klang",
  initial_territories: [],
  available_ports: MODERN_PORTS.map((p) => p.id),
  ship_classes: MODERN_SHIPS.map((s) => s.id),
  starting_ships: [{ class_id: "feeder_1000", name: "MV Selat Harmoni", port_id: "port_klang" }],
  goods: MODERN_GOODS.map((g) => g.id),
  technologies: MODERN_TECHNOLOGIES.map((t) => t.id),
  starting_technologies: [],
  infrastructure_available: ["docks", "warehouse", "shipyard", "cargo_handling", "navigation", "repair", "administration", "commercial_district"],
  currency: { code: "USD", symbol: "$", name: "US dollar", note: "Amounts are gameplay abstractions." },
  initial_treasury: 6_000_000,
  difficulty_treasury_multiplier: { easy: 1.5, normal: 1, hard: 0.6 },
  objectives: [
    {
      id: "obj_modern_tutorial", order: 1, title: "First delivery: Port Klang to Singapore", tutorial: true,
      description: "Accept a container contract at Port Klang, load it on MV Selat Harmoni and deliver it to Singapore.",
      condition: { type: "contracts_completed_with_port", port_id: "singapore", count: 1 }, reward: 250_000,
      historical_basis: "fictional", basis_note: "Tutorial voyage along one of the world's busiest short-sea lanes.",
    },
    {
      id: "obj_modern_five", order: 2, title: "Regular service", description: "Complete five container contracts.",
      condition: { type: "contracts_completed", count: 5 }, reward: 500_000, historical_basis: "fictional",
    },
    {
      id: "obj_modern_second_ship", order: 3, title: "Second hull", description: "Operate two vessels at once.",
      condition: { type: "ships_owned", count: 2 }, reward: 750_000, historical_basis: "fictional",
    },
    {
      id: "obj_modern_six_ports", order: 4, title: "Regional network", description: "Call at six different ports.",
      condition: { type: "ports_visited", count: 6 }, reward: 1_000_000, historical_basis: "fictional",
    },
    {
      id: "obj_modern_treasury", order: 5, title: "Capital for expansion", description: "Hold a treasury of at least $40 million.",
      condition: { type: "treasury_at_least", amount: 40_000_000 }, reward: 0, historical_basis: "fictional",
    },
    {
      id: "obj_modern_europe", order: 6, title: "Asia–Europe service", description: "Complete a contract delivered to Rotterdam.",
      condition: { type: "contracts_completed_with_port", port_id: "rotterdam", count: 1 }, reward: 2_000_000, historical_basis: "fictional",
    },
  ],
  historical_events: [],
  historical_routes: [],
  wind: null,
  fuel_price_per_unit: 620,
  fuel_unit_label: "t VLSFO",
  base_port_fee: 18_000,
  contract_margin: 0.32,
  features: { diplomacy: false, technology: true, territory: false, fuel: true, provisions: false, wind: false, modern_borders: true },
  sources: ["src_unctad_rmt", "src_levinson_box"],
  evidence_status: "established",
};
