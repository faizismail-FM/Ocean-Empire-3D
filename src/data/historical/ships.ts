import type { VesselClassInput as VesselClass } from "../schemas";

const BALANCE = "Speed, capacity and cost values are gameplay abstractions, not documented historical figures.";

/**
 * Historical vessel classes. Names describe construction traditions rather than
 * anachronistic labels: the modern word "dhow" does not appear in medieval Arabic sources
 * (Agius 2008), so the Gulf vessels are described as sewn-plank ships of the Indian Ocean.
 */
export const HISTORICAL_SHIPS: VesselClass[] = [
  // Ninth-century Gulf / Indian Ocean
  {
    id: "ship_sewn_coaster", name_or_class: "Sewn-plank coastal vessel", vessel_type: "Coastal sailing vessel",
    era: "medieval", civilization_or_region: "Persian Gulf and Arabian Sea", propulsion: "sail", model: "lateen_coaster",
    length_m: 12, cargo_capacity: 40, cargo_unit: "t", max_speed_knots: 6, acceleration_knots_per_s: 0.05, deceleration_knots_per_s: 0.05,
    turn_rate_deg_per_s: 3.5, endurance_capacity: 20, consumption_per_day_at_max: 1, min_sailing_angle_deg: 60,
    purchase_cost: 700, maintenance_per_day: 1.5, crew: 8, required_shipyard_level: 0, required_technology: null,
    earliest_documented_period: 700, latest_documented_period: 1500,
    capabilities: "Short coastal passages within the Gulf and along Arabian shores.",
    historical_notes: "Small sewn boats with a single sail served the Gulf's coastal traffic. Their exact rigs for the ninth century are not securely documented; the game uses a simplified sail model.",
    evidence_status: "reconstruction", sources: ["src_agius_2008", "src_hourani"], balance_note: BALANCE,
  },
  {
    id: "ship_sewn_ocean", name_or_class: "Sewn-plank ocean-going ship (Belitung type)", vessel_type: "Ocean-going sailing merchantman",
    era: "medieval", civilization_or_region: "Arabian / Persian Gulf and western Indian Ocean", propulsion: "sail", model: "sewn_plank",
    length_m: 18, cargo_capacity: 150, cargo_unit: "t", max_speed_knots: 7.5, acceleration_knots_per_s: 0.04, deceleration_knots_per_s: 0.04,
    turn_rate_deg_per_s: 2.5, endurance_capacity: 45, consumption_per_day_at_max: 1, min_sailing_angle_deg: 65,
    purchase_cost: 2400, maintenance_per_day: 4, crew: 20, required_shipyard_level: 1, required_technology: null,
    earliest_documented_period: 800, latest_documented_period: 1000,
    capabilities: "Monsoon voyages across the Arabian Sea and, with provisioning, on to Southeast Asia and China.",
    historical_notes: "The Belitung wreck (c. 826 CE), found off Sumatra with some 60,000 Chinese ceramics, is the only excavated example: a hull about 18 m long with planks stitched together with fibre rather than nailed, built of timbers consistent with an Arab or Indian origin.",
    evidence_status: "established", sources: ["src_flecker_2001", "src_shipwrecked_2010", "src_agius_2008", "src_hourani"], balance_note: BALANCE,
  },
  {
    id: "ship_sewn_large", name_or_class: "Large sewn-plank ship", vessel_type: "Ocean-going sailing merchantman",
    era: "medieval", civilization_or_region: "Persian Gulf", propulsion: "sail", model: "sewn_plank",
    length_m: 26, cargo_capacity: 320, cargo_unit: "t", max_speed_knots: 7, acceleration_knots_per_s: 0.03, deceleration_knots_per_s: 0.03,
    turn_rate_deg_per_s: 1.8, endurance_capacity: 60, consumption_per_day_at_max: 1, min_sailing_angle_deg: 70,
    purchase_cost: 6000, maintenance_per_day: 9, crew: 40, required_shipyard_level: 2, required_technology: "tech_large_hulls",
    earliest_documented_period: 800, latest_documented_period: 1200,
    capabilities: "High-capacity monsoon voyages for bulk goods such as teak, dates and textiles.",
    historical_notes: "Arabic texts mention large ocean-going ships but give no reliable dimensions; this class is a gameplay reconstruction of a bigger hull in the same tradition.",
    evidence_status: "reconstruction", sources: ["src_agius_2008", "src_hourani"], balance_note: BALANCE,
  },
  // Fifteenth-century Straits
  {
    id: "ship_lancaran", name_or_class: "Lancaran", vessel_type: "Oared and sailed coastal vessel",
    era: "early_modern", civilization_or_region: "Malay world", propulsion: "sail", model: "lancaran",
    length_m: 18, cargo_capacity: 50, cargo_unit: "t", max_speed_knots: 7, acceleration_knots_per_s: 0.06, deceleration_knots_per_s: 0.06,
    turn_rate_deg_per_s: 3.5, endurance_capacity: 20, consumption_per_day_at_max: 1, min_sailing_angle_deg: 55,
    purchase_cost: 900, maintenance_per_day: 2, crew: 25, required_shipyard_level: 0, required_technology: null,
    earliest_documented_period: 1500, latest_documented_period: 1700,
    capabilities: "Fast coastal and inter-island work in the Straits; oars allow progress in calm or contrary winds.",
    historical_notes: "Lancaran are described in Portuguese sources of the early sixteenth century as swift Malay craft with sails and oars; their fifteenth-century form is inferred.",
    evidence_status: "scholarly_interpretation", sources: ["src_manguin_1980", "src_pires_suma"], balance_note: BALANCE,
  },
  {
    id: "ship_jong_small", name_or_class: "Jong (medium)", vessel_type: "Southeast Asian trading ship",
    era: "early_modern", civilization_or_region: "Malay and Javanese", propulsion: "sail", model: "jong",
    length_m: 30, cargo_capacity: 200, cargo_unit: "t", max_speed_knots: 7, acceleration_knots_per_s: 0.04, deceleration_knots_per_s: 0.04,
    turn_rate_deg_per_s: 2.2, endurance_capacity: 40, consumption_per_day_at_max: 1, min_sailing_angle_deg: 70,
    purchase_cost: 3000, maintenance_per_day: 5, crew: 60, required_shipyard_level: 1, required_technology: null,
    earliest_documented_period: 1300, latest_documented_period: 1600,
    capabilities: "Monsoon voyages between the Straits, Java and the Bay of Bengal.",
    historical_notes: "Jong were built with multiple layers of planking fastened with dowels and lashings, several masts and quarter rudders. Manguin estimates typical capacities of several hundred tonnes.",
    evidence_status: "established", sources: ["src_manguin_1980", "src_manguin_1993", "src_reid_1988"], balance_note: BALANCE,
  },
  {
    id: "ship_jong_large", name_or_class: "Jong (large)", vessel_type: "Southeast Asian trading ship",
    era: "early_modern", civilization_or_region: "Malay and Javanese", propulsion: "sail", model: "jong",
    length_m: 45, cargo_capacity: 450, cargo_unit: "t", max_speed_knots: 6.5, acceleration_knots_per_s: 0.03, deceleration_knots_per_s: 0.03,
    turn_rate_deg_per_s: 1.5, endurance_capacity: 60, consumption_per_day_at_max: 1, min_sailing_angle_deg: 75,
    purchase_cost: 8000, maintenance_per_day: 11, crew: 120, required_shipyard_level: 2, required_technology: "tech_large_jong",
    earliest_documented_period: 1400, latest_documented_period: 1600,
    capabilities: "Bulk carriage of rice, cloth and spices on the Java–Melaka and Melaka–India runs.",
    historical_notes: "Portuguese observers described very large jong; Manguin concludes that vessels of 400–500 tonnes were common and some exceeded this. Dimensions in the game are conservative.",
    evidence_status: "scholarly_interpretation", sources: ["src_manguin_1980", "src_pires_suma", "src_reid_1988"], balance_note: BALANCE,
  },
  {
    id: "ship_junk_hybrid", name_or_class: "South China Sea hybrid junk", vessel_type: "Ocean-going junk",
    era: "early_modern", civilization_or_region: "Chinese and Southeast Asian shipwrights", propulsion: "sail", model: "junk",
    length_m: 35, cargo_capacity: 300, cargo_unit: "t", max_speed_knots: 7.5, acceleration_knots_per_s: 0.04, deceleration_knots_per_s: 0.04,
    turn_rate_deg_per_s: 2.0, endurance_capacity: 50, consumption_per_day_at_max: 1, min_sailing_angle_deg: 60,
    purchase_cost: 6000, maintenance_per_day: 8, crew: 70, required_shipyard_level: 2, required_technology: "tech_hybrid_hull",
    earliest_documented_period: 1400, latest_documented_period: 1600,
    capabilities: "Efficient battened lug rigs sail closer to the wind; well suited to the South China Sea run.",
    historical_notes: "Manguin identified a 'South China Sea tradition' of hybrid ships combining Chinese bulkheads and rigs with Southeast Asian hull construction, built in Southeast Asian ports from the fifteenth century.",
    evidence_status: "scholarly_interpretation", sources: ["src_manguin_1993", "src_dreyer_zheng_he"], balance_note: BALANCE,
  },
];
