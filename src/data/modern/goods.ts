import type { TradeGoodInput as TradeGood } from "../schemas";

/** Containerised cargo categories. Prices are per TEU and are gameplay abstractions. */
export const MODERN_GOODS: TradeGood[] = [
  {
    id: "electronics", name: "Electronics", category: "container",
    description: "Consumer electronics and components, typically moving from East and Southeast Asian factories to consumer markets.",
    historical_availability: { start: 1970, end: null }, base_price: 4200, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "garments", name: "Garments & textiles", category: "container",
    description: "Finished clothing and fabrics.",
    historical_availability: { start: 1970, end: null }, base_price: 2600, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "machinery", name: "Machinery", category: "container",
    description: "Industrial machinery and equipment, often from European, Japanese, Korean and Chinese manufacturers.",
    historical_availability: { start: 1970, end: null }, base_price: 3800, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "auto_parts", name: "Automotive parts", category: "container",
    description: "Components for vehicle assembly plants.",
    historical_availability: { start: 1970, end: null }, base_price: 3400, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "consumer_goods", name: "Consumer goods", category: "container",
    description: "Household goods, toys and general merchandise.",
    historical_availability: { start: 1970, end: null }, base_price: 2400, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "furniture", name: "Furniture", category: "container",
    description: "Flat-pack and finished furniture; bulky, low value per container.",
    historical_availability: { start: 1970, end: null }, base_price: 1900, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "refrigerated_food", name: "Refrigerated food (reefer)", category: "container",
    description: "Perishable food in refrigerated containers; requires reefer plugs and faster transit.",
    historical_availability: { start: 1970, end: null }, base_price: 5200, cargo_space: 1, storage: "refrigerated",
    trade_restrictions: "Time-sensitive: deadlines are shorter and late penalties higher.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "chemicals", name: "Chemicals", category: "container",
    description: "Packaged chemicals and plastics in standard or tank containers.",
    historical_availability: { start: 1970, end: null }, base_price: 3100, cargo_space: 1, storage: "liquid",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "palm_oil", name: "Palm oil (ISO tanks)", category: "container",
    description: "Processed palm oil shipped in tank containers from Malaysia and Indonesia.",
    historical_availability: { start: 1970, end: null }, base_price: 2800, cargo_space: 1, storage: "liquid",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "paper_pulp", name: "Paper & pulp", category: "container",
    description: "Recovered paper and pulp, a common backhaul cargo from consumer markets to Asian mills.",
    historical_availability: { start: 1970, end: null }, base_price: 1400, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "rubber_products", name: "Rubber products", category: "container",
    description: "Tyres, gloves and natural rubber from Southeast Asian producers.",
    historical_availability: { start: 1970, end: null }, base_price: 2300, cargo_space: 1, storage: "dry",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
];
