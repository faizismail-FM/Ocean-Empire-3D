import type { TradeGoodInput as TradeGood } from "../schemas";

/** Historical trade goods. Prices are per tonne-equivalent and are gameplay abstractions. */
export const HISTORICAL_GOODS: TradeGood[] = [
  // Shared across medieval scenarios
  {
    id: "good_pepper", name: "Pepper", category: "spice",
    description: "Black pepper from the Malabar coast and, by the fifteenth century, northern Sumatra; the bulk commodity of Indian Ocean trade.",
    historical_availability: { start: -500, end: null }, base_price: 60, cargo_space: 1,
    evidence_status: "established", sources: ["src_chaudhuri_1985", "src_reid_1988", "src_malekandathil_2010"],
  },
  {
    id: "good_tin", name: "Tin", category: "metal",
    description: "Tin from the Malay Peninsula. The Arabic word for tin, qalaʿī, derives from Kalah; in the fifteenth century Melaka's hinterland tin was a staple export.",
    historical_availability: { start: 800, end: null }, base_price: 45, cargo_space: 1,
    evidence_status: "established", sources: ["src_tibbetts_1979", "src_ma_huan", "src_andaya_malaysia"],
  },
  {
    id: "good_camphor", name: "Camphor", category: "aromatic",
    description: "Crystalline camphor from Sumatra and Borneo, prized in the Islamic world and China for medicine and ritual.",
    historical_availability: { start: 500, end: null }, base_price: 220, cargo_space: 0.5,
    evidence_status: "established", sources: ["src_hourani", "src_reid_1988"],
  },
  {
    id: "good_gems", name: "Precious stones", category: "luxury",
    description: "Sapphires and rubies from Sri Lanka and, later, Pegu.",
    historical_availability: { start: -500, end: null }, base_price: 400, cargo_space: 0.2,
    evidence_status: "established", sources: ["src_carswell_mantai", "src_pires_suma"],
  },
  {
    id: "good_silk", name: "Silk", category: "textile",
    description: "Chinese silk cloth and yarn, carried west through Southeast Asian ports.",
    historical_availability: { start: -200, end: null }, base_price: 180, cargo_space: 0.6,
    evidence_status: "established", sources: ["src_wang_gungwu_nanhai", "src_pires_suma"],
  },
  // Ninth-century Gulf trade
  {
    id: "good_dates", name: "Dates", category: "food",
    description: "Dried dates from Basra and Oman, a staple provision and export of the Gulf.",
    historical_availability: { start: -2000, end: null }, base_price: 12, cargo_space: 1,
    evidence_status: "established", sources: ["src_hourani"],
  },
  {
    id: "good_pearls", name: "Pearls", category: "luxury",
    description: "Pearls from the Gulf fisheries around Bahrain and the Persian coast.",
    historical_availability: { start: -2000, end: 1930 }, base_price: 350, cargo_space: 0.1,
    evidence_status: "established", sources: ["src_hourani", "src_abu_zayd"],
  },
  {
    id: "good_frankincense", name: "Frankincense", category: "aromatic",
    description: "Resin of Boswellia trees from Hadramawt, Dhofar and Somalia, burned as incense across Asia.",
    historical_availability: { start: -1500, end: null }, base_price: 120, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_hourani"],
  },
  {
    id: "good_ambergris", name: "Ambergris", category: "aromatic",
    description: "A waxy substance from sperm whales collected on Indian Ocean shores; Abu Zayd describes its trade.",
    historical_availability: { start: 700, end: null }, base_price: 500, cargo_space: 0.1,
    evidence_status: "established", sources: ["src_abu_zayd"],
  },
  {
    id: "good_textiles_iraq", name: "Iraqi textiles", category: "textile",
    description: "Linen, cotton and silk fabrics from Basra and the Iraqi workshops.",
    historical_availability: { start: 700, end: 1300 }, base_price: 90, cargo_space: 0.7,
    evidence_status: "scholarly_interpretation", sources: ["src_kennedy_caliphates", "src_hourani"],
  },
  {
    id: "good_textiles_sind", name: "Sindhi cotton", category: "textile",
    description: "Cotton cloth from the Indus valley.",
    historical_availability: { start: 700, end: 1500 }, base_price: 70, cargo_space: 0.7,
    evidence_status: "scholarly_interpretation", sources: ["src_wink_al_hind"],
  },
  {
    id: "good_teak", name: "Teak", category: "timber",
    description: "Indian teak, essential for Gulf shipbuilding since the Arabian shores lacked suitable timber.",
    historical_availability: { start: -500, end: null }, base_price: 35, cargo_space: 1.2,
    evidence_status: "established", sources: ["src_hourani", "src_agius_2008"],
  },
  {
    id: "good_chinese_ceramics", name: "Chinese ceramics", category: "ceramic",
    description: "Changsha bowls, Yue greenwares and white wares of the Tang period, shipped in bulk; the Belitung cargo held some 60,000 pieces.",
    historical_availability: { start: 700, end: 1000 }, base_price: 110, cargo_space: 1, storage: "fragile",
    evidence_status: "established", sources: ["src_flecker_2001", "src_shipwrecked_2010"],
  },
  {
    id: "good_aromatics", name: "Aromatic woods and resins", category: "aromatic",
    description: "Aloeswood (agarwood), sandalwood and benzoin from Southeast Asia.",
    historical_availability: { start: 500, end: null }, base_price: 160, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_hourani", "src_tibbetts_1979"],
  },
  {
    id: "good_ivory", name: "Ivory", category: "luxury",
    description: "African elephant ivory carried from the Zanj coast to the Gulf, India and China.",
    historical_availability: { start: -500, end: null }, base_price: 200, cargo_space: 0.5,
    evidence_status: "established", sources: ["src_horton_middleton"],
  },
  {
    id: "good_mangrove", name: "Mangrove poles", category: "timber",
    description: "Building timber from East African mangrove swamps, exported to the treeless Gulf.",
    historical_availability: { start: 700, end: null }, base_price: 20, cargo_space: 1.2,
    evidence_status: "established", sources: ["src_horton_middleton"],
  },
  {
    id: "good_cinnamon", name: "Cinnamon", category: "spice",
    description: "Cinnamon bark, associated with Sri Lanka in medieval sources.",
    historical_availability: { start: -300, end: null }, base_price: 90, cargo_space: 0.8,
    evidence_status: "scholarly_interpretation", sources: ["src_chaudhuri_1985"],
  },
  // Fifteenth-century Straits trade
  {
    id: "good_cloves", name: "Cloves", category: "spice",
    description: "Dried flower buds grown only on a few islands of northern Maluku in this period.",
    historical_availability: { start: -200, end: null }, base_price: 300, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1993"],
  },
  {
    id: "good_nutmeg", name: "Nutmeg and mace", category: "spice",
    description: "Seed and aril of the nutmeg tree, grown only on the Banda Islands.",
    historical_availability: { start: 500, end: null }, base_price: 280, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1993"],
  },
  {
    id: "good_sandalwood", name: "Sandalwood", category: "aromatic",
    description: "Fragrant wood from Timor and neighbouring islands, carried via Java.",
    historical_availability: { start: 500, end: null }, base_price: 140, cargo_space: 1,
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1988"],
  },
  {
    id: "good_gold", name: "Gold", category: "luxury",
    description: "Gold dust and ingots from Sumatra and the Malay Peninsula.",
    historical_availability: { start: -500, end: null }, base_price: 600, cargo_space: 0.1,
    evidence_status: "established", sources: ["src_reid_1988", "src_pires_suma"],
  },
  {
    id: "good_gujarati_cloth", name: "Gujarati cloth", category: "textile",
    description: "Printed and woven cottons from Cambay and its hinterland; Pires called cloth the main currency of the spice trade.",
    historical_availability: { start: 1200, end: 1800 }, base_price: 95, cargo_space: 0.7,
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1988"],
  },
  {
    id: "good_coromandel_cloth", name: "Coromandel cloth", category: "textile",
    description: "Painted and dyed cottons from the Coromandel coast, shipped from Pulicat.",
    historical_availability: { start: 1200, end: 1800 }, base_price: 100, cargo_space: 0.7,
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1988"],
  },
  {
    id: "good_porcelain", name: "Chinese porcelain", category: "ceramic",
    description: "Ming blue-and-white and celadon wares reaching Melaka through tribute trade and smuggling.",
    historical_availability: { start: 1300, end: null }, base_price: 150, cargo_space: 1, storage: "fragile",
    evidence_status: "established", sources: ["src_ma_huan", "src_pires_suma"],
  },
  {
    id: "good_rice", name: "Rice", category: "food",
    description: "The staple food of the region, imported to Melaka from Java, Siam and Pegu because the city grew little of its own.",
    historical_availability: { start: -3000, end: null }, base_price: 15, cargo_space: 1,
    evidence_status: "established", sources: ["src_reid_1988", "src_pires_suma"],
  },
  {
    id: "good_benzoin", name: "Benzoin", category: "aromatic",
    description: "A fragrant resin from Sumatra and the mainland, used for incense and medicine.",
    historical_availability: { start: 800, end: null }, base_price: 130, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_reid_1988"],
  },
  {
    id: "good_copper_cash", name: "Chinese copper cash", category: "metal",
    description: "Strung bronze coins that circulated as currency across maritime Southeast Asia.",
    historical_availability: { start: 1000, end: 1700 }, base_price: 80, cargo_space: 0.8,
    evidence_status: "established", sources: ["src_reid_1988"],
  },
];
