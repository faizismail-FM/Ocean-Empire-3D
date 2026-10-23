import type { Technology } from "../schemas";

/**
 * Scenario-specific technology trees. These are capabilities a trading house can acquire,
 * not claims that a civilization "invented" them at a particular date; the notes explain
 * what is documented and what is a gameplay abstraction.
 */
export const HISTORICAL_TECHNOLOGIES: Technology[] = [
  // Siraf, ninth century
  {
    id: "tech_monsoon_calendar", name: "Monsoon sailing calendar", branch: "navigation", cost: 600, prerequisites: [],
    effects: [{ type: "speed_multiplier", value: 1.08 }],
    description: "Systematic knowledge of when to leave each port so that the monsoon carries the ship rather than fights it.",
    historical_notes: "Arabic geographers and later pilots describe fixed seasons for departures between the Gulf, India and China. Ninth-century captains clearly used this knowledge; written sailing calendars survive only from later centuries.",
    evidence_status: "established", sources: ["src_hourani", "src_chaudhuri_1985"],
  },
  {
    id: "tech_stellar_navigation", name: "Star-altitude navigation", branch: "navigation", cost: 1200, prerequisites: ["tech_monsoon_calendar"],
    effects: [{ type: "speed_multiplier", value: 1.05 }, { type: "consumption_multiplier", value: 0.92 }],
    description: "Latitude sailing by the altitude of the Pole Star and other guide stars.",
    historical_notes: "Indian Ocean pilots measured star altitudes; the kamal instrument and detailed star-course manuals are documented from the fifteenth century (Ibn Mājid), so the ninth-century practice is inferred rather than described.",
    evidence_status: "uncertain", sources: ["src_tibbetts_1979", "src_hourani"],
  },
  {
    id: "tech_sewn_hull", name: "Improved sewn-plank construction", branch: "shipbuilding", cost: 900, prerequisites: [],
    effects: [{ type: "maintenance_multiplier", value: 0.85 }],
    description: "Better fibre stitching, caulking and hull protection extend the life of sewn hulls.",
    historical_notes: "Sewn-plank construction is attested by the Belitung wreck and by Arabic descriptions; specific improvements are a gameplay abstraction.",
    evidence_status: "reconstruction", sources: ["src_agius_2008", "src_flecker_2001"],
  },
  {
    id: "tech_large_hulls", name: "Large ocean hulls", branch: "shipbuilding", cost: 2500, prerequisites: ["tech_sewn_hull"],
    effects: [{ type: "unlock_ship", ship_class_id: "ship_sewn_large" }],
    description: "Shipwrights capable of building larger sewn-plank merchantmen.",
    historical_notes: "Arabic authors mention large ships but no measured examples survive; the unlocked class is a reconstruction.",
    evidence_status: "reconstruction", sources: ["src_agius_2008"],
  },
  {
    id: "tech_teak_imports", name: "Indian teak supply", branch: "vessel_efficiency", cost: 800, prerequisites: [],
    effects: [{ type: "maintenance_multiplier", value: 0.9 }, { type: "cargo_multiplier", value: 1.04 }],
    description: "Secure supplies of Malabar teak for hulls and spars.",
    historical_notes: "Hourani stresses that Gulf shipbuilding depended on imported Indian timber, especially teak.",
    evidence_status: "established", sources: ["src_hourani"],
  },
  {
    id: "tech_credit_instruments", name: "Credit instruments (ṣakk and suftaja)", branch: "commercial_administration", cost: 1500, prerequisites: [],
    effects: [{ type: "contract_payment_multiplier", value: 1.08 }, { type: "extra_contracts", value: 1 }],
    description: "Letters of credit and partnership contracts let your house finance voyages without carrying coin.",
    historical_notes: "Abbasid-era commercial law recognised partnerships (shirka, qirāḍ) and instruments such as the suftaja; Udovitch analyses the legal framework.",
    evidence_status: "established", sources: ["src_udovitch_1970"],
  },
  {
    id: "tech_funduq", name: "Merchant hostels and warehouses", branch: "port_infrastructure", cost: 1000, prerequisites: [],
    effects: [{ type: "port_fee_multiplier", value: 0.9 }],
    description: "Agreements with hostel-warehouses in foreign ports where your goods and agents can lodge.",
    historical_notes: "Merchant lodging and storage complexes are well documented in the medieval Islamic world; their ninth-century presence in each specific port is not individually attested.",
    evidence_status: "scholarly_interpretation", sources: ["src_kennedy_caliphates", "src_whitehouse_siraf"],
  },
  // Melaka, fifteenth century
  {
    id: "tech_shahbandar", name: "Shahbandar harbour administration", branch: "commercial_administration", cost: 800, prerequisites: [],
    effects: [{ type: "port_fee_multiplier", value: 0.9 }, { type: "extra_contracts", value: 1 }],
    description: "Working relationships with the harbourmasters who allocate berths, warehouses and introductions to the sultan.",
    historical_notes: "Pires describes four shahbandars at Melaka, each responsible for a group of foreign merchant communities.",
    evidence_status: "established", sources: ["src_pires_suma", "src_thomaz_1993"],
  },
  {
    id: "tech_maritime_code", name: "Maritime law (Undang-Undang Laut)", branch: "commercial_administration", cost: 1500, prerequisites: ["tech_shahbandar"],
    effects: [{ type: "contract_payment_multiplier", value: 1.06 }, { type: "maintenance_multiplier", value: 0.92 }],
    description: "Codified rules on the authority of the ship's master, cargo shares and disputes at sea.",
    historical_notes: "The Melaka maritime code is traditionally placed in the reign of Mahmud Shah (1488–1511); its earlier development is uncertain, so the game treats it as a capability to adopt rather than a dated event.",
    evidence_status: "scholarly_interpretation", sources: ["src_winstedt_maritime_laws", "src_andaya_malaysia"],
  },
  {
    id: "tech_monsoon_scheduling", name: "Monsoon trading seasons", branch: "navigation", cost: 600, prerequisites: [],
    effects: [{ type: "speed_multiplier", value: 1.08 }],
    description: "Timing departures so that fleets from India, China and Java arrive and leave Melaka with the seasonal winds.",
    historical_notes: "Melaka's trade depended on the alternation of the monsoons, which brought western and eastern merchants to the city in different seasons.",
    evidence_status: "established", sources: ["src_reid_1988", "src_pires_suma"],
  },
  {
    id: "tech_large_jong", name: "Large jong construction", branch: "shipbuilding", cost: 2500, prerequisites: [],
    effects: [{ type: "unlock_ship", ship_class_id: "ship_jong_large" }],
    description: "Shipwrights able to lay down the multi-layered hulls of the largest jong.",
    historical_notes: "Large jong are documented by Portuguese observers around 1511–1515; Manguin reconstructs their construction techniques.",
    evidence_status: "scholarly_interpretation", sources: ["src_manguin_1980", "src_manguin_1993"],
  },
  {
    id: "tech_hybrid_hull", name: "South China Sea hybrid shipbuilding", branch: "shipbuilding", cost: 2200, prerequisites: ["tech_large_jong"],
    effects: [{ type: "unlock_ship", ship_class_id: "ship_junk_hybrid" }],
    description: "Adopting Chinese bulkheads and battened lug sails within Southeast Asian hull construction.",
    historical_notes: "Manguin's 'South China Sea tradition' of hybrid vessels, built in Southeast Asian yards with Chinese and local techniques, is dated to the fifteenth and sixteenth centuries.",
    evidence_status: "scholarly_interpretation", sources: ["src_manguin_1993"],
  },
  {
    id: "tech_gudang", name: "Godown storage network", branch: "port_infrastructure", cost: 1000, prerequisites: [],
    effects: [{ type: "contract_payment_multiplier", value: 1.04 }, { type: "port_fee_multiplier", value: 0.95 }],
    description: "Leased godowns (gudang) in partner ports so cargo can wait for the right season and price.",
    historical_notes: "Pires notes that Melaka's merchants stored goods in warehouses to await the monsoon fleets; the network of leases is a gameplay abstraction.",
    evidence_status: "reconstruction", sources: ["src_pires_suma", "src_reid_1988"],
  },
  {
    id: "tech_tribute_diplomacy", name: "Tribute mission to the Ming court", branch: "commercial_administration", cost: 3000, prerequisites: ["tech_shahbandar"],
    effects: [{ type: "contract_payment_multiplier", value: 1.05 }],
    description: "Participation in Melaka's tribute embassies, which opened official trade with Guangzhou.",
    historical_notes: "Melaka sent regular tribute missions to the Ming court from 1405 onwards; trade conducted alongside tribute was the legal channel for Chinese goods.",
    evidence_status: "established", sources: ["src_dreyer_zheng_he", "src_andaya_malaysia"],
  },
];
