import type { SettlementRecord, TerritorialExtent } from "../schemas";

/**
 * Dated territorial control and inland settlements for the map layers. Every outline is a
 * coarse approximation drawn for orientation: where the scholarship gives no precise
 * boundary for a period, the map says "approximate" rather than inventing one. Periods
 * use conventional dates; `approximate` marks the debated ones. Several extents change
 * within a campaign (Zanj Iraq 869–883, Thessalonica 1423 and 1430, Constantinople 1453,
 * Cyprus 1426, the Morea 1460), so the map re-reads them at the game date.
 */

const SIRAF = ["siraf_850"];
const KILWA = ["kilwa_1330"];
const VENICE = ["venice_1423"];
const MELAKA = ["melaka_1460"];
const PORTUGAL = ["portugal_1505"];
const DUTCH = ["dutch_1602"];
const MING = ["ming_1405"];

export const TERRITORIAL_EXTENTS: TerritorialExtent[] = [
  // ---- Ninth century ------------------------------------------------------------------
  {
    id: "ext_abbasid_850", polity_id: "civ_abbasid", label: "Abbasid Caliphate", control: "direct",
    period: { start: 750, end: 1258, approximate: true, note: "The caliphate's nominal extent; by 850 provincial governors and local dynasties held much real power." },
    polygon: [[30, 31.5], [36, 37], [44, 39.5], [50, 38.5], [58, 37.5], [63.5, 34], [62.5, 25.5], [57, 22], [52, 17.5], [48.5, 14.5], [44, 13], [40, 18], [36, 24], [32, 24.5], [30, 28]],
    note: "Egypt and Khurasan were governed by largely autonomous dynasties (Tulunids from 868, Tahirids and then Saffarids) while acknowledging the caliph.",
    evidence_status: "scholarly_interpretation", sources: ["src_kennedy_caliphates"], scenario_ids: SIRAF,
  },
  {
    id: "ext_zanj_iraq", polity_id: null, label: "Zanj rebels", control: "rebel",
    period: { start: 869, end: 883 },
    polygon: [[46.3, 31.6], [48.6, 31.6], [48.9, 30.1], [47.6, 29.6], [46.2, 30.6]],
    note: "The rebels held the marshes and much of lower Iraq, including Basra after 871, until al-Muwaffaq's victory in 883.",
    evidence_status: "established", sources: ["src_popovic_zanj", "src_kennedy_caliphates"], scenario_ids: SIRAF,
  },
  {
    id: "ext_oman_ibadi", polity_id: "civ_oman_ibadi", label: "Ibadi Imamate of Oman", control: "direct",
    period: { start: 793, end: 893, approximate: true },
    polygon: [[56, 24.6], [59.5, 23.2], [59.9, 22], [58.6, 20.2], [56.6, 20.6], [55.6, 22.2], [55.8, 23.8]],
    evidence_status: "scholarly_interpretation", sources: ["src_kennedy_caliphates"], scenario_ids: SIRAF,
  },
  {
    id: "ext_abbasid_oman_893", polity_id: "civ_abbasid", label: "Abbasid Oman", control: "direct",
    period: { start: 893, end: 931, approximate: true, note: "Direct caliphal administration after the reconquest of 893; it lapsed within a few decades." },
    polygon: [[56, 24.6], [59.5, 23.2], [59.9, 22], [58.6, 20.2], [56.6, 20.6], [55.6, 22.2], [55.8, 23.8]],
    evidence_status: "uncertain", sources: ["src_kennedy_caliphates"], scenario_ids: SIRAF,
  },
  {
    id: "ext_ziyadid", polity_id: "civ_ziyadid_yemen", label: "Ziyadid Yemen", control: "direct",
    period: { start: 819, end: 1018, approximate: true, note: "Effective control over Aden and the highlands is uncertain." },
    polygon: [[42.4, 16.6], [44, 16], [44.6, 14.6], [45.6, 13], [43.5, 12.8], [42.4, 14.6]],
    evidence_status: "uncertain", sources: ["src_kennedy_caliphates", "src_margariti_aden"], scenario_ids: SIRAF,
  },
  {
    id: "ext_sind_habbari", polity_id: "civ_abbasid_sind", label: "Arab Sind (Habbarid emirate)", control: "direct",
    period: { start: 854, end: 1026, approximate: true },
    polygon: [[66, 27.2], [69.6, 27.2], [70.2, 24], [68, 23.4], [66.4, 24.6]],
    evidence_status: "scholarly_interpretation", sources: ["src_wink_al_hind"], scenario_ids: SIRAF,
  },
  {
    id: "ext_chera", polity_id: "civ_chera_venad", label: "Chera (Kulasekhara) Kerala", control: "direct",
    period: { start: 800, end: 1124, approximate: true },
    polygon: [[75, 12.6], [76.6, 12.6], [77.2, 10], [77.3, 8.2], [76.5, 8], [75.5, 10.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_narayanan_perumals"], scenario_ids: SIRAF,
  },
  {
    id: "ext_anuradhapura", polity_id: "civ_anuradhapura", label: "Anuradhapura kingdom", control: "direct",
    period: { start: 600, end: 1017, approximate: true, note: "The kingdom is far older; the period shown is the one relevant to the campaign." },
    polygon: [[79.7, 9.8], [81.5, 9], [81.9, 7], [81.5, 6], [80.2, 5.9], [79.8, 7.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_carswell_mantai"], scenario_ids: SIRAF,
  },
  {
    id: "ext_srivijaya", polity_id: "civ_srivijaya", label: "Srivijaya", control: "sphere",
    period: { start: 700, end: 1025, approximate: true, note: "A thalassocracy of allied ports rather than a bounded state." },
    polygon: [[98, 6.5], [101, 6], [104, 2], [106.5, -3], [105, -6], [102, -4], [99.5, 0], [97.5, 3]],
    evidence_status: "scholarly_interpretation", sources: ["src_wolters_1970", "src_wheatley_1961"], scenario_ids: SIRAF,
  },
  {
    id: "ext_tang", polity_id: "civ_tang", label: "Tang China", control: "direct",
    period: { start: 618, end: 907 },
    polygon: [[100, 22], [110, 21.5], [117, 23.5], [122, 30], [120, 36], [115, 40], [105, 38], [100, 30]],
    note: "Southern and eastern provinces only; the dynasty's full extent lies beyond the map.",
    evidence_status: "established", sources: ["src_wang_gungwu_nanhai"], scenario_ids: SIRAF,
  },
  {
    id: "ext_early_swahili", polity_id: "civ_early_swahili", label: "Swahili trading settlements", control: "sphere",
    period: { start: 750, end: 1000, approximate: true, note: "Autonomous settlements along the coast, not a state." },
    polygon: [[39.5, -1], [41.6, -1.6], [41.8, -3], [40.3, -5], [39.6, -7], [38.9, -5.5], [39, -3]],
    evidence_status: "established", sources: ["src_chittick_manda", "src_horton_middleton"], scenario_ids: SIRAF,
  },

  // ---- Fourteenth century --------------------------------------------------------------
  {
    id: "ext_kilwa_direct", polity_id: "civ_kilwa", label: "Kilwa Sultanate", control: "direct",
    period: { start: 1300, end: 1505, approximate: true },
    polygon: [[39, -8], [40, -8], [40.2, -9.5], [39.3, -10.5], [38.9, -9.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_sutton_1998", "src_chittick_kilwa"], scenario_ids: [...KILWA, ...PORTUGAL],
  },
  {
    id: "ext_kilwa_sphere", polity_id: "civ_kilwa", label: "Kilwa's control of the Sofala trade", control: "sphere",
    period: { start: 1300, end: 1500, approximate: true, note: "Commercial control exercised through a governor at Sofala, not territorial administration." },
    polygon: [[38.5, -8.5], [41.5, -10], [41, -16], [36.5, -20.5], [34.5, -20.5], [35, -18], [37, -15], [38.5, -11]],
    evidence_status: "scholarly_interpretation", sources: ["src_kilwa_chronicle", "src_pearson_1998", "src_sutton_1998"], scenario_ids: KILWA,
  },
  {
    id: "ext_mogadishu", polity_id: "civ_mogadishu", label: "Sultanate of Mogadishu", control: "direct",
    period: { start: 1250, end: 1500, approximate: true },
    polygon: [[44.5, 3], [46.5, 3], [46.3, 1.3], [44.9, 1.5]],
    evidence_status: "uncertain", sources: ["src_ibn_battuta_gibb", "src_swahili_world_2018"], scenario_ids: [...KILWA, ...MING],
  },
  {
    id: "ext_mombasa_14c", polity_id: "civ_mombasa_14c", label: "Mombasa", control: "direct",
    period: { start: 1100, end: 1500, approximate: true },
    polygon: [[39.4, -3.8], [40, -3.8], [40, -4.3], [39.4, -4.3]],
    evidence_status: "uncertain", sources: ["src_ibn_battuta_gibb", "src_kusimba_1999"], scenario_ids: KILWA,
  },
  {
    id: "ext_zanzibar_14c", polity_id: "civ_zanzibar_14c", label: "Towns of Zanzibar island", control: "direct",
    period: { start: 1100, end: 1500, approximate: true },
    polygon: [[39.1, -5.7], [39.6, -5.7], [39.6, -6.5], [39.1, -6.5]],
    evidence_status: "uncertain", sources: ["src_horton_middleton", "src_swahili_world_2018"], scenario_ids: KILWA,
  },
  {
    id: "ext_rasulid", polity_id: "civ_rasulid", label: "Rasulid Yemen", control: "direct",
    period: { start: 1229, end: 1454 },
    polygon: [[42.5, 17], [44.5, 17], [46, 15.5], [49, 14.5], [49, 13], [45, 12.6], [43, 12.8], [42.5, 14.5]],
    note: "Highland control fluctuated; the Tihama, Taʿizz and Aden were the dynasty's core.",
    evidence_status: "scholarly_interpretation", sources: ["src_margariti_aden", "src_ibn_battuta_gibb"], scenario_ids: [...KILWA, ...MING],
  },
  {
    id: "ext_hormuz_direct", polity_id: "civ_hormuz", label: "Kingdom of Hormuz", control: "direct",
    period: { start: 1300, end: 1507, approximate: true },
    polygon: [[55.5, 27.5], [57.5, 27.5], [57.5, 26.3], [56, 26.3]],
    evidence_status: "scholarly_interpretation", sources: ["src_iranica_hormuz"], scenario_ids: [...KILWA, ...PORTUGAL, ...MING],
  },
  {
    id: "ext_hormuz_oman", polity_id: "civ_hormuz", label: "Hormuz on the Omani coast", control: "suzerainty",
    period: { start: 1300, end: 1507, approximate: true, note: "Qalhat and the coast acknowledged Hormuz; inland Oman did not." },
    polygon: [[56, 24.8], [59.8, 23], [59.9, 22], [58.6, 21.6], [56.5, 23.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_iranica_hormuz", "src_ibn_battuta_gibb"], scenario_ids: [...KILWA, ...PORTUGAL, ...MING],
  },
  {
    id: "ext_delhi_tughluq", polity_id: "civ_delhi_tughluq", label: "Delhi Sultanate (Tughluq)", control: "direct",
    period: { start: 1320, end: 1407, approximate: true, note: "Greatest extent under Muhammad bin Tughluq; the Deccan was lost from 1347 and Gujarat became independent in 1407." },
    polygon: [[68, 25], [72, 30], [78, 31], [86, 26], [88, 23], [80, 18], [76, 17], [73, 19], [72, 22], [69, 22]],
    evidence_status: "scholarly_interpretation", sources: ["src_jackson_delhi"], scenario_ids: KILWA,
  },

  // ---- Fifteenth century: Venice -------------------------------------------------------
  {
    id: "ext_venice_terraferma", polity_id: "civ_venice", label: "Venetian terraferma", control: "direct",
    period: { start: 1405, end: 1797, approximate: true, note: "Padua, Vicenza and Verona from 1405; Friuli from 1420." },
    polygon: [[10.6, 46.3], [12.5, 46.6], [13.7, 46.2], [13.6, 45.6], [12.2, 45.1], [11, 44.9], [10.5, 45.5]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_venice_lombardy", polity_id: "civ_venice", label: "Brescia and Bergamo", control: "direct",
    period: { start: 1428, end: 1797, note: "Brescia taken in 1426 and Bergamo in 1428, confirmed at Lodi in 1454." },
    polygon: [[9.5, 45.9], [10.6, 46.3], [10.5, 45.5], [9.6, 45.3]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_venice_candia", polity_id: "civ_venice", label: "Venetian Crete (Candia)", control: "direct",
    period: { start: 1211, end: 1669 },
    polygon: [[23.5, 35.3], [26.3, 35.3], [26.3, 34.9], [23.5, 34.9]],
    evidence_status: "established", sources: ["src_lane_1973", "src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_venice_modon", polity_id: "civ_venice", label: "Modon and Coron", control: "direct",
    period: { start: 1207, end: 1500 },
    polygon: [[21.5, 37], [22.1, 37], [22.1, 36.7], [21.5, 36.7]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_venice_negroponte", polity_id: "civ_venice", label: "Negroponte (Euboea)", control: "direct",
    period: { start: 1390, end: 1470 },
    polygon: [[22.8, 39.1], [24.6, 38.8], [24.6, 38], [23.2, 38.3]],
    evidence_status: "established", sources: ["src_lane_1973", "src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_venice_corfu", polity_id: "civ_venice", label: "Corfu", control: "direct",
    period: { start: 1386, end: 1797 },
    polygon: [[19.6, 39.9], [20.2, 39.9], [20.1, 39.3], [19.7, 39.4]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_thessalonica_byzantine", polity_id: "civ_byzantium_late", label: "Byzantine Thessalonica", control: "direct",
    period: { start: 1403, end: 1423, note: "Recovered from the Ottomans in 1403; handed to Venice in September 1423." },
    polygon: [[22.6, 40.8], [23.3, 40.8], [23.3, 40.4], [22.6, 40.4]],
    evidence_status: "established", sources: ["src_nicol_1988", "src_necipoglu_2009"], scenario_ids: VENICE,
  },
  {
    id: "ext_thessalonica_venetian", polity_id: "civ_venice", label: "Venetian Thessalonica", control: "direct",
    period: { start: 1423, end: 1430 },
    polygon: [[22.6, 40.8], [23.3, 40.8], [23.3, 40.4], [22.6, 40.4]],
    evidence_status: "established", sources: ["src_nicol_1988", "src_necipoglu_2009"], scenario_ids: VENICE,
  },
  {
    id: "ext_thessalonica_ottoman", polity_id: "civ_ottoman_early", label: "Ottoman Thessalonica", control: "direct",
    period: { start: 1430, end: 1912 },
    polygon: [[22.6, 40.8], [23.3, 40.8], [23.3, 40.4], [22.6, 40.4]],
    evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_byzantium_constantinople", polity_id: "civ_byzantium_late", label: "Byzantine Constantinople", control: "direct",
    period: { start: 1261, end: 1453 },
    polygon: [[28.3, 41.4], [29.3, 41.4], [29.3, 40.8], [28.3, 40.8]],
    evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_byzantium_morea", polity_id: "civ_byzantium_late", label: "Despotate of the Morea", control: "direct",
    period: { start: 1349, end: 1460, approximate: true, note: "Ruled by Palaiologan despots; conquered by Mehmed II in 1460." },
    polygon: [[21.3, 38.3], [23.3, 38.2], [23.3, 36.4], [21.6, 36.5]],
    evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_ottoman_1423", polity_id: "civ_ottoman_early", label: "Ottoman Empire", control: "direct",
    period: { start: 1413, end: 1922, approximate: true, note: "Core Anatolian and Balkan lands after Mehmed I's reunification; frontiers moved constantly." },
    polygon: [[22, 42.5], [27, 43.5], [30, 41.5], [36, 41.8], [41, 41], [41, 38], [36, 36.6], [30, 36.5], [26.5, 38.5], [26, 40], [23.6, 40.6], [22.5, 41.2]],
    evidence_status: "scholarly_interpretation", sources: ["src_nicol_1988", "src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_ottoman_constantinople", polity_id: "civ_ottoman_early", label: "Ottoman Constantinople", control: "direct",
    period: { start: 1453, end: 1922 },
    polygon: [[28.3, 41.4], [29.3, 41.4], [29.3, 40.8], [28.3, 40.8]],
    evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_ottoman_morea", polity_id: "civ_ottoman_early", label: "Ottoman Morea", control: "direct",
    period: { start: 1460, end: 1685, approximate: true },
    polygon: [[21.3, 38.3], [23.3, 38.2], [23.3, 36.4], [21.6, 36.5]],
    evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE,
  },
  {
    id: "ext_mamluk", polity_id: "civ_mamluk", label: "Mamluk Sultanate", control: "direct",
    period: { start: 1250, end: 1517 },
    polygon: [[25, 31.8], [32, 31.6], [36, 37], [38.5, 37.5], [41, 36.5], [39, 33], [36, 29], [34.5, 27], [32.5, 24], [25, 22]],
    evidence_status: "established", sources: ["src_ashtor_1983"], scenario_ids: [...VENICE, ...PORTUGAL],
  },
  {
    id: "ext_mamluk_cyprus", polity_id: "civ_mamluk", label: "Cyprus under Mamluk tribute", control: "suzerainty",
    period: { start: 1426, end: 1489 },
    polygon: [[32.2, 35.6], [34.6, 35.7], [34.6, 34.5], [32.2, 34.5]],
    evidence_status: "established", sources: ["src_hill_cyprus"], scenario_ids: VENICE,
  },
  {
    id: "ext_cyprus_lusignan", polity_id: "civ_cyprus_lusignan", label: "Kingdom of Cyprus", control: "direct",
    period: { start: 1192, end: 1489 },
    polygon: [[32.2, 35.6], [34.6, 35.7], [34.6, 34.5], [32.2, 34.5]],
    evidence_status: "established", sources: ["src_hill_cyprus"], scenario_ids: VENICE,
  },
  {
    id: "ext_genoa_famagusta", polity_id: "civ_genoa", label: "Genoese Famagusta", control: "direct",
    period: { start: 1373, end: 1464 },
    polygon: [[33.7, 35.4], [34.15, 35.4], [34.15, 34.95], [33.7, 34.95]],
    evidence_status: "established", sources: ["src_hill_cyprus"], scenario_ids: VENICE,
  },
  {
    id: "ext_genoa", polity_id: "civ_genoa", label: "Republic of Genoa", control: "direct",
    period: { start: 1099, end: 1797, approximate: true, note: "Under Milanese lordship 1421–1435 and again later; the Ligurian coast only." },
    polygon: [[7.5, 44.4], [10, 44.4], [10, 43.9], [7.5, 43.7]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_hafsid", polity_id: "civ_hafsid", label: "Hafsid Ifriqiya", control: "direct",
    period: { start: 1229, end: 1574, approximate: true },
    polygon: [[7.5, 37.2], [11.3, 37.2], [11.3, 33], [9, 30.5], [7.5, 33.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_lane_1973", "src_ashtor_1983"], scenario_ids: VENICE,
  },
  {
    id: "ext_ragusa", polity_id: "civ_ragusa", label: "Republic of Ragusa", control: "direct",
    period: { start: 1358, end: 1808 },
    polygon: [[17.5, 43], [18.6, 42.8], [18.3, 42.4], [17.6, 42.7]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },
  {
    id: "ext_burgundy_flanders", polity_id: "civ_burgundy_flanders", label: "Burgundian Low Countries", control: "direct",
    period: { start: 1384, end: 1482, approximate: true, note: "Flanders from 1384; Holland, Zeeland and Brabant added in the 1420s and 1430s." },
    polygon: [[2.5, 51.3], [4.5, 52.5], [6, 52.3], [6, 50.5], [4, 50], [2.5, 50.8]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: [...VENICE, ...PORTUGAL],
  },
  {
    id: "ext_england_15c", polity_id: "civ_england_15c", label: "Kingdom of England", control: "direct",
    period: { start: 1399, end: 1485 },
    polygon: [[-5.7, 50], [1.8, 51.2], [1.8, 53], [-1.5, 55.8], [-3, 55.5], [-5.5, 51.5]],
    evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE,
  },

  // ---- Fifteenth century: Melaka -------------------------------------------------------
  {
    id: "ext_melaka_direct", polity_id: "civ_melaka", label: "Melaka Sultanate", control: "direct",
    period: { start: 1400, end: 1511, approximate: true },
    polygon: [[100.3, 3.5], [102.3, 2.8], [103.1, 1.6], [102.6, 1.5], [101.3, 2.6]],
    evidence_status: "scholarly_interpretation", sources: ["src_andaya_malaysia", "src_thomaz_1993"], scenario_ids: [...MELAKA, ...PORTUGAL, ...MING],
  },
  {
    id: "ext_melaka_sphere", polity_id: "civ_melaka", label: "Melaka's suzerainty over the peninsula and eastern Sumatra", control: "suzerainty",
    period: { start: 1460, end: 1511, approximate: true, note: "Pahang, Kedah, Patani, Kampar and Siak acknowledged Melaka under Mansur Shah; the extent is debated." },
    polygon: [[99.6, 6], [103.5, 6], [104.5, 1.5], [103.2, 0.5], [101.5, -0.5], [100.5, 1.5], [99.5, 3.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_andaya_malaysia", "src_sejarah_melayu"], scenario_ids: MELAKA,
  },
  {
    id: "ext_ming", polity_id: "civ_ming", label: "Ming China", control: "direct",
    period: { start: 1368, end: 1644 },
    polygon: [[98, 22], [110, 21.5], [118, 23], [122, 30], [121, 34], [117, 35], [105, 35], [99, 30], [98, 28]],
    note: "Southern and eastern provinces only.",
    evidence_status: "established", sources: ["src_dreyer_zheng_he"], scenario_ids: [...MELAKA, ...DUTCH, ...MING],
  },
  {
    id: "ext_majapahit", polity_id: "civ_majapahit", label: "Majapahit (core)", control: "direct",
    period: { start: 1293, end: 1527, approximate: true, note: "Eastern and central Java; wider claims over the archipelago are disputed and the kingdom was in decline by 1460." },
    polygon: [[108, -6.3], [114.5, -7], [114.5, -8.5], [110, -8.2], [108, -7]],
    evidence_status: "scholarly_interpretation", sources: ["src_reid_1988"], scenario_ids: [...MELAKA, ...MING],
  },
  {
    id: "ext_pasai", polity_id: "civ_pasai", label: "Samudera Pasai", control: "direct",
    period: { start: 1267, end: 1521, approximate: true },
    polygon: [[95.5, 5.3], [97.6, 5.3], [97.6, 4.6], [95.8, 4.5]],
    evidence_status: "uncertain", sources: ["src_reid_1988", "src_pires_suma"], scenario_ids: [...MELAKA, ...MING],
  },
  {
    id: "ext_ayutthaya", polity_id: "civ_ayutthaya", label: "Ayutthaya", control: "direct",
    period: { start: 1351, end: 1767, approximate: true },
    polygon: [[98.5, 17.5], [101.5, 17.5], [102, 14], [101, 12], [99.5, 12.5], [98.8, 15]],
    evidence_status: "scholarly_interpretation", sources: ["src_reid_1988"], scenario_ids: [...MELAKA, ...MING],
  },
  {
    id: "ext_hanthawaddy", polity_id: "civ_hanthawaddy", label: "Hanthawaddy (Pegu)", control: "direct",
    period: { start: 1287, end: 1539, approximate: true },
    polygon: [[95.5, 18], [97.8, 18], [97.8, 15.5], [96.5, 15.5], [95.5, 16.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_reid_1988"], scenario_ids: [...MELAKA, ...MING],
  },
  {
    id: "ext_calicut", polity_id: "civ_calicut", label: "Zamorin of Calicut", control: "direct",
    period: { start: 1400, end: 1600, approximate: true },
    polygon: [[75.5, 12.3], [76.5, 12.3], [76.3, 10.2], [75.6, 10.3]],
    evidence_status: "uncertain", sources: ["src_malekandathil_2010", "src_pires_suma"], scenario_ids: [...MELAKA, ...PORTUGAL, ...MING],
  },
  {
    id: "ext_gujarat_sultanate", polity_id: "civ_gujarat_sultanate", label: "Gujarat Sultanate", control: "direct",
    period: { start: 1407, end: 1573 },
    polygon: [[68.5, 24.5], [72, 24.8], [73.8, 22.5], [72.5, 20.5], [70, 20.8], [68.8, 22.5]],
    evidence_status: "established", sources: ["src_pires_suma", "src_reid_1988"], scenario_ids: [...MELAKA, ...PORTUGAL],
  },
  {
    id: "ext_vijayanagara", polity_id: "civ_vijayanagara", label: "Vijayanagara", control: "direct",
    period: { start: 1336, end: 1565, approximate: true },
    polygon: [[73.5, 17], [79, 17], [80.3, 14], [79, 11], [77, 10], [75, 12], [73.8, 15]],
    evidence_status: "scholarly_interpretation", sources: ["src_reid_1988", "src_malekandathil_2010"], scenario_ids: [...MELAKA, ...PORTUGAL, ...MING],
  },
  {
    id: "ext_ternate", polity_id: "civ_ternate", label: "Ternate", control: "direct",
    period: { start: 1400, end: 1600, approximate: true },
    polygon: [[127, 1.2], [127.7, 1.2], [127.7, 0.4], [127, 0.4]],
    evidence_status: "uncertain", sources: ["src_reid_1988"], scenario_ids: MELAKA,
  },
  {
    id: "ext_banda", polity_id: "civ_banda", label: "Banda islands", control: "direct",
    period: { start: 1400, end: 1621, approximate: true },
    polygon: [[129.6, -4.3], [130.2, -4.3], [130.2, -4.8], [129.6, -4.8]],
    evidence_status: "uncertain", sources: ["src_reid_1988"], scenario_ids: MELAKA,
  },
  {
    id: "ext_brunei", polity_id: "civ_brunei", label: "Brunei", control: "direct",
    period: { start: 1400, end: 1600, approximate: true },
    polygon: [[113.5, 5.5], [115.5, 5.5], [115.5, 4.2], [113.5, 4.2]],
    evidence_status: "uncertain", sources: ["src_reid_1988"], scenario_ids: MELAKA,
  },
  // ---- Sixteenth century: the Carreira da Índia --------------------------------------
  {
    id: "ext_portugal", polity_id: "civ_portugal", label: "Kingdom of Portugal", control: "direct",
    period: { start: 1249, end: 1580, note: "Borders settled with Castile by 1297; shown to the union of crowns in 1580." },
    polygon: [[-9.5, 42.1], [-6.2, 41.9], [-6.9, 37.1], [-8.9, 37], [-9.5, 39]],
    evidence_status: "established", sources: ["src_newitt_2005"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_madeira", polity_id: "civ_portugal", label: "Madeira", control: "direct",
    period: { start: 1420, end: 1910, approximate: true },
    polygon: [[-17.3, 32.9], [-16.6, 32.9], [-16.6, 32.6], [-17.3, 32.6]],
    evidence_status: "established", sources: ["src_diffie_winius_1977"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_mina", polity_id: "civ_portugal", label: "São Jorge da Mina", control: "direct",
    period: { start: 1482, end: 1637, note: "The fortress and its immediate surroundings; the Akan states of the hinterland were independent." },
    polygon: [[-1.6, 5.3], [-1.1, 5.3], [-1.1, 4.95], [-1.6, 4.95]],
    evidence_status: "established", sources: ["src_diffie_winius_1977", "src_newitt_2005"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_estado_cochin", polity_id: "civ_portugal", label: "Portuguese Cochin and Cannanore (forts)", control: "suzerainty",
    period: { start: 1503, end: 1663, note: "Forts within allied kingdoms; the rajas kept their lands." },
    polygon: [[75.2, 12.1], [76.5, 12.1], [76.6, 9.8], [76, 9.8]],
    evidence_status: "established", sources: ["src_pearson_1987"], scenario_ids: [...PORTUGAL, ...DUTCH],
  },
  {
    id: "ext_estado_kilwa", polity_id: "civ_portugal", label: "Portuguese Kilwa", control: "suzerainty",
    period: { start: 1505, end: 1512 },
    polygon: [[39.2, -8.7], [39.9, -8.7], [39.9, -9.3], [39.2, -9.3]],
    evidence_status: "established", sources: ["src_newitt_2005"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_estado_sofala", polity_id: "civ_portugal", label: "Portuguese Sofala and Mozambique", control: "direct",
    period: { start: 1505, end: 1975, approximate: true, note: "The forts and their surroundings only; the Mozambique fort dates from 1507." },
    polygon: [[34.3, -14.6], [41.2, -14.6], [41.2, -15.6], [36, -19.5], [34.3, -20.6]],
    evidence_status: "established", sources: ["src_newitt_2005"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_estado_goa", polity_id: "civ_portugal", label: "Portuguese Goa", control: "direct",
    period: { start: 1510, end: 1961, note: "The island of Goa and, later, the Old Conquests." },
    polygon: [[73.7, 15.7], [74.1, 15.7], [74.1, 15.2], [73.7, 15.2]],
    evidence_status: "established", sources: ["src_albuquerque_commentaries", "src_subrahmanyam_1993"], scenario_ids: [...PORTUGAL, ...DUTCH],
  },
  {
    id: "ext_estado_malacca", polity_id: "civ_portugal", label: "Portuguese Malacca", control: "direct",
    period: { start: 1511, end: 1641 },
    polygon: [[102, 2.5], [102.5, 2.5], [102.5, 2], [102, 2]],
    evidence_status: "established", sources: ["src_albuquerque_commentaries", "src_andaya_malaysia"], scenario_ids: [...PORTUGAL, ...DUTCH],
  },
  {
    id: "ext_estado_hormuz", polity_id: "civ_portugal", label: "Hormuz under Portuguese tribute", control: "suzerainty",
    period: { start: 1515, end: 1622 },
    polygon: [[55.5, 27.5], [57.5, 27.5], [57.5, 26.3], [56, 26.3]],
    evidence_status: "established", sources: ["src_albuquerque_commentaries", "src_iranica_hormuz"], scenario_ids: [...PORTUGAL, ...DUTCH],
  },
  {
    id: "ext_estado_diu", polity_id: "civ_portugal", label: "Portuguese Diu", control: "direct",
    period: { start: 1535, end: 1961 },
    polygon: [[70.85, 20.8], [71.05, 20.8], [71.05, 20.65], [70.85, 20.65]],
    evidence_status: "established", sources: ["src_pearson_1987"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_bijapur", polity_id: "civ_bijapur", label: "Adil Shahi Bijapur", control: "direct",
    period: { start: 1490, end: 1686, approximate: true },
    polygon: [[73.5, 18], [77, 18], [77.5, 15.5], [75, 14.5], [73.8, 15.3]],
    evidence_status: "scholarly_interpretation", sources: ["src_subrahmanyam_1993"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_bijapur_goa", polity_id: "civ_bijapur", label: "Bijapur's Goa", control: "direct",
    period: { start: 1490, end: 1510 },
    polygon: [[73.7, 15.7], [74.1, 15.7], [74.1, 15.2], [73.7, 15.2]],
    evidence_status: "established", sources: ["src_subrahmanyam_1993"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_cochin_kingdom", polity_id: "civ_cochin", label: "Kingdom of Cochin", control: "direct",
    period: { start: 1341, end: 1663, approximate: true },
    polygon: [[76, 10.5], [76.9, 10.5], [76.9, 9.5], [76.1, 9.5]],
    evidence_status: "uncertain", sources: ["src_pearson_1987"], scenario_ids: PORTUGAL,
  },
  {
    id: "ext_ottoman_egypt", polity_id: "civ_ottoman_early", label: "Ottoman Egypt and the Red Sea", control: "direct",
    period: { start: 1517, end: 1867, approximate: true },
    polygon: [[25, 31.8], [32, 31.6], [36, 37], [38.5, 37.5], [41, 36.5], [39, 33], [36, 29], [39, 23], [43, 13], [42.5, 12.8], [36, 22], [32, 24], [25, 22]],
    note: "Yemen was occupied in 1538; the Hijaz acknowledged the sultan from 1517.",
    evidence_status: "scholarly_interpretation", sources: ["src_subrahmanyam_1993"], scenario_ids: PORTUGAL,
  },

  // ---- Early fifteenth century: the Ming treasure fleets --------------------------------
  {
    id: "ext_ming_jiaozhi", polity_id: "civ_ming", label: "Jiaozhi (Ming-occupied Đại Việt)", control: "direct",
    period: { start: 1407, end: 1427, note: "Annexed July 1407; abandoned after Lê Lợi's victories at the end of 1427." },
    polygon: [[103.0, 22.8], [106.7, 22.9], [108.0, 21.5], [106.6, 20.0], [106.2, 18.3], [105.0, 19.0], [104.2, 20.5], [103.0, 21.5]],
    evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING,
  },
  {
    id: "ext_ryukyu_chuzan", polity_id: "civ_ryukyu", label: "Chuzan (central Okinawa)", control: "direct",
    period: { start: 1372, end: 1428, approximate: true, note: "One of three Okinawan principalities; Hokuzan fell to Shō Hashi in 1416 and Nanzan in 1429." },
    polygon: [[127.6, 26.5], [128.0, 26.6], [128.1, 26.2], [127.7, 26.1]],
    evidence_status: "scholarly_interpretation", sources: ["src_cambridge_ming_1988"], scenario_ids: MING,
  },
  {
    id: "ext_ryukyu_kingdom", polity_id: "civ_ryukyu", label: "Kingdom of Ryukyu", control: "direct",
    period: { start: 1429, end: 1879, note: "United under Shō Hashi in 1429; the outer islands were brought under Shuri through the fifteenth century." },
    polygon: [[127.6, 26.9], [128.3, 26.9], [128.4, 26.0], [127.6, 26.0]],
    evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING,
  },
  {
    id: "ext_ashikaga", polity_id: "civ_ashikaga", label: "Ashikaga Japan", control: "suzerainty",
    period: { start: 1392, end: 1467, approximate: true, note: "From the reunion of the courts (1392) to the Ōnin war; the shogun's authority ran through the provincial lords (shugo)." },
    polygon: [[129.5, 33.8], [131.0, 34.6], [135.0, 35.8], [138.5, 38.2], [141.5, 41.2], [142.0, 40.0], [141.0, 36.8], [139.9, 35.0], [137.0, 34.3], [133.0, 33.4], [131.2, 31.1], [130.0, 31.4]],
    evidence_status: "scholarly_interpretation", sources: ["src_cambridge_ming_1988"], scenario_ids: MING,
  },
  {
    id: "ext_champa_vijaya", polity_id: "civ_champa", label: "Champa (Vijaya)", control: "direct",
    period: { start: 1000, end: 1471, approximate: true, note: "The central coast from the Hải Vân pass to Phan Rang; the northern provinces were lost to Đại Việt by stages and Vijaya fell in 1471." },
    polygon: [[107.8, 16.3], [108.3, 16.1], [109.4, 13.6], [109.1, 11.6], [108.4, 11.2], [107.9, 12.5], [108.0, 14.5], [107.6, 15.8]],
    evidence_status: "scholarly_interpretation", sources: ["src_ma_huan"], scenario_ids: MING,
  },
  {
    id: "ext_kotte", polity_id: "civ_kotte", label: "Kotte and Raigama (south-western Sri Lanka)", control: "direct",
    period: { start: 1371, end: 1597, approximate: true, note: "Alakeshvara's lowland kingdom; Parakramabahu VI (1412–1467) later brought the whole island under Kotte for a generation." },
    polygon: [[79.8, 7.6], [80.6, 7.4], [81.0, 6.4], [80.6, 5.9], [80.0, 6.1], [79.8, 6.8]],
    evidence_status: "scholarly_interpretation", sources: ["src_dreyer_zheng_he", "src_levathes_1994"], scenario_ids: MING,
  },
  {
    id: "ext_bengal_sultanate", polity_id: "civ_bengal_sultanate", label: "Bengal Sultanate", control: "direct",
    period: { start: 1352, end: 1576, approximate: true, note: "The delta and its hinterland; the eastern frontier toward Arakan and Tripura moved through the period." },
    polygon: [[86.8, 25.8], [89.5, 26.2], [91.8, 25.0], [92.2, 23.2], [91.5, 21.8], [89.0, 21.6], [87.5, 22.3], [86.6, 24.0]],
    evidence_status: "scholarly_interpretation", sources: ["src_sen_2006"], scenario_ids: MING,
  },
  {
    id: "ext_palembang_superintendency", polity_id: "civ_ming", label: "Palembang pacification superintendency", control: "sphere",
    period: { start: 1407, end: 1440, approximate: true, note: "Shi Jinqing and his heirs governed the Chinese of the Old Port in the Ming's name; the office faded after the voyages ended." },
    polygon: [[104.4, -2.6], [105.2, -2.6], [105.2, -3.3], [104.4, -3.3]],
    evidence_status: "scholarly_interpretation", sources: ["src_ma_huan", "src_dreyer_zheng_he"], scenario_ids: MING,
  },

  // ---- Seventeenth century: the Dutch East India Company ----------------------------
  {
    id: "ext_dutch_republic", polity_id: "civ_dutch_republic", label: "Dutch Republic (the United Provinces)", control: "direct",
    period: { start: 1588, end: 1795, note: "The seven provinces and the Generality Lands; the frontier with the Spanish Netherlands moved until Münster (1648)." },
    polygon: [[3.4, 51.4], [4.2, 51.95], [4.6, 53.1], [6.9, 53.5], [7.2, 52.9], [6.0, 52.0], [6.1, 51.0], [5.7, 50.8], [4.3, 51.3]],
    evidence_status: "established", sources: ["src_israel_1989"], scenario_ids: DUTCH,
  },
  {
    id: "ext_iberian_union_portugal", polity_id: "civ_portugal", label: "Portugal under the Habsburg crowns", control: "direct",
    period: { start: 1580, end: 1640, note: "The union of crowns, 1580–1640; Portugal regained a king of its own in December 1640." },
    polygon: [[-9.5, 42.1], [-6.2, 41.9], [-6.9, 37.1], [-8.9, 37], [-9.5, 39]],
    evidence_status: "established", sources: ["src_boxer_1965"], scenario_ids: DUTCH,
  },
  {
    id: "ext_portugal_1640", polity_id: "civ_portugal", label: "Kingdom of Portugal (restored)", control: "direct",
    period: { start: 1641, end: null, note: "From the Braganza restoration of 1640." },
    polygon: [[-9.5, 42.1], [-6.2, 41.9], [-6.9, 37.1], [-8.9, 37], [-9.5, 39]],
    evidence_status: "established", sources: ["src_boxer_1965"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_amboina", polity_id: "civ_dutch_republic", label: "Company Amboina", control: "direct",
    period: { start: 1605, end: 1795, note: "Fort Victoria and the clove-bearing Ambon-Lease islands after van der Hagen's capture of 1605." },
    polygon: [[127.8, -3.5], [128.4, -3.5], [128.4, -3.9], [127.8, -3.9]],
    evidence_status: "established", sources: ["src_andaya_maluku_1993", "src_gaastra_2003"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_ternate", polity_id: "civ_dutch_republic", label: "Ternate under Company protection", control: "suzerainty",
    period: { start: 1607, end: 1795, note: "The treaty of 1607 made the sultan a Company client; the Spanish held forts on the island until 1663." },
    polygon: [[127.2, 1.0], [127.6, 1.0], [127.6, 0.6], [127.2, 0.6]],
    evidence_status: "established", sources: ["src_andaya_maluku_1993"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_pulicat", polity_id: "civ_dutch_republic", label: "Fort Geldria (Pulicat)", control: "direct",
    period: { start: 1610, end: 1690, note: "The Company's Coromandel headquarters until the move to Nagapattinam." },
    polygon: [[80.2, 13.5], [80.4, 13.5], [80.4, 13.3], [80.2, 13.3]],
    evidence_status: "established", sources: ["src_das_bruijn"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_batavia", polity_id: "civ_dutch_republic", label: "Batavia and its Ommelanden", control: "direct",
    period: { start: 1619, end: 1795, note: "The town and its surrounding lands; the boundary with Banten and Mataram remained contested for decades." },
    polygon: [[106.5, -5.9], [107.2, -5.9], [107.3, -6.5], [106.5, -6.5]],
    evidence_status: "established", sources: ["src_blusse_1986", "src_gaastra_2003"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_banda", polity_id: "civ_dutch_republic", label: "Company Banda", control: "direct",
    period: { start: 1621, end: 1795, note: "After the conquest of 1621 and the destruction of the Bandanese." },
    polygon: [[129.7, -4.4], [130.2, -4.4], [130.2, -4.7], [129.7, -4.7]],
    evidence_status: "established", sources: ["src_andaya_maluku_1993"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_zeelandia", polity_id: "civ_dutch_republic", label: "Formosa (Fort Zeelandia)", control: "direct",
    period: { start: 1624, end: 1662, note: "The south-western plain around Tayouan; the Company never held the whole island. Taken by Koxinga in 1662." },
    polygon: [[120.0, 23.6], [120.6, 23.6], [120.6, 22.5], [120.0, 22.5]],
    evidence_status: "established", sources: ["src_blusse_1986"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_malacca", polity_id: "civ_dutch_republic", label: "Company Malacca", control: "direct",
    period: { start: 1641, end: 1795 },
    polygon: [[102, 2.5], [102.5, 2.5], [102.5, 2], [102, 2]],
    evidence_status: "established", sources: ["src_boxer_1965"], scenario_ids: DUTCH,
  },
  {
    id: "ext_voc_cape", polity_id: "civ_dutch_republic", label: "Cape station", control: "direct",
    period: { start: 1652, end: 1795, note: "Van Riebeeck's fort and gardens at Table Bay; the settlement grew far beyond this outline later in the century." },
    polygon: [[18.3, -33.8], [18.7, -33.8], [18.7, -34.1], [18.3, -34.1]],
    evidence_status: "established", sources: ["src_gaastra_2003"], scenario_ids: DUTCH,
  },
  {
    id: "ext_banten", polity_id: "civ_banten", label: "Sultanate of Banten", control: "direct",
    period: { start: 1527, end: 1682, approximate: true, note: "West Java and the Lampung pepper lands across the Strait; the Company's frontier at Batavia from 1619." },
    polygon: [[104.5, -4.8], [105.9, -5.9], [106.4, -5.9], [106.4, -6.9], [105.2, -6.9], [104.4, -5.6]],
    evidence_status: "scholarly_interpretation", sources: ["src_blusse_1986"], scenario_ids: DUTCH,
  },
  {
    id: "ext_mataram", polity_id: "civ_mataram", label: "Sultanate of Mataram", control: "direct",
    period: { start: 1587, end: 1755, approximate: true, note: "Central and east Java under Sultan Agung (1613–1645); the coastal ports owed tribute rather than direct rule." },
    polygon: [[107.3, -6.5], [111.0, -6.4], [114.3, -7.6], [114.4, -8.6], [110.0, -8.2], [107.5, -7.6]],
    evidence_status: "scholarly_interpretation", sources: ["src_blusse_1986"], scenario_ids: DUTCH,
  },
  {
    id: "ext_tokugawa", polity_id: "civ_tokugawa", label: "Tokugawa Japan", control: "direct",
    period: { start: 1603, end: 1868, note: "The shogunate's rule over the home islands; the domains kept their own lords under it." },
    polygon: [[129.5, 33.8], [131.0, 34.6], [135.0, 35.8], [138.5, 38.2], [141.5, 41.2], [142.0, 40.0], [141.0, 36.8], [139.9, 35.0], [137.0, 34.3], [133.0, 33.4], [131.2, 31.1], [130.0, 31.4]],
    evidence_status: "established", sources: ["src_gaastra_2003"], scenario_ids: DUTCH,
  },
  {
    id: "ext_mughal_17c", polity_id: "civ_mughal", label: "Mughal Empire", control: "direct",
    period: { start: 1573, end: 1707, approximate: true, note: "From the conquest of Gujarat (1573) to Aurangzeb's death; the Deccan frontier moved south through the period." },
    polygon: [[66.5, 25.5], [68.5, 29.0], [74.0, 33.5], [78.0, 32.0], [88.0, 27.0], [90.5, 24.5], [88.5, 22.0], [80.0, 21.5], [74.0, 20.5], [72.5, 20.5], [70.0, 20.8], [68.0, 23.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_das_bruijn"], scenario_ids: DUTCH,
  },
  {
    id: "ext_golconda", polity_id: "civ_golconda", label: "Golconda (Qutb Shahi sultanate)", control: "direct",
    period: { start: 1518, end: 1687, approximate: true, note: "The northern Coromandel coast from the Krishna delta to Masulipatnam and inland to Hyderabad." },
    polygon: [[77.5, 19.5], [80.0, 19.3], [82.3, 17.3], [80.5, 15.6], [79.5, 14.5], [78.0, 15.5], [77.0, 17.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_das_bruijn"], scenario_ids: DUTCH,
  },
  {
    id: "ext_safavid", polity_id: "civ_safavid", label: "Safavid Persia", control: "direct",
    period: { start: 1501, end: 1736, approximate: true, note: "Under Shah Abbas I (1588–1629) and his successors; the Gulf coast came under direct rule with the taking of Hormuz in 1622." },
    polygon: [[44.5, 39.0], [48.0, 39.5], [53.0, 37.5], [60.0, 37.0], [61.5, 31.0], [59.5, 26.0], [57.0, 25.8], [52.0, 27.5], [50.0, 30.0], [48.0, 30.2], [46.0, 34.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_glamann_1958"], scenario_ids: DUTCH,
  },
  {
    id: "ext_ottoman_yemen", polity_id: "civ_yemen_17c", label: "Yemen (Ottoman province, then the Qasimi imamate)", control: "direct",
    period: { start: 1538, end: 1872, approximate: true, note: "Ottoman from 1538; the Qasimi imams expelled the Ottomans by 1635 and ruled the Tihama and highlands." },
    polygon: [[42.6, 16.6], [44.5, 17.4], [46.5, 16.0], [45.5, 13.5], [43.9, 12.7], [43.1, 13.6]],
    evidence_status: "scholarly_interpretation", sources: ["src_glamann_1958"], scenario_ids: DUTCH,
  },
  {
    id: "ext_vijayanagara_late", polity_id: "civ_vijayanagara", label: "Vijayanagara (the Aravidu kings and their nayakas)", control: "suzerainty",
    period: { start: 1565, end: 1646, approximate: true, note: "After Talikota (1565) the kings at Penukonda, Chandragiri and Vellore held only loose suzerainty over the nayakas of the Tamil country." },
    polygon: [[77.0, 14.5], [79.5, 14.3], [80.4, 13.4], [80.2, 11.5], [79.0, 10.5], [77.5, 11.5]],
    evidence_status: "scholarly_interpretation", sources: ["src_das_bruijn"], scenario_ids: DUTCH,
  },
];

export const SETTLEMENTS: SettlementRecord[] = [
  // Ninth century
  { id: "stl_baghdad", name: "Baghdad", kind: "capital", latitude: 33.33, longitude: 44.37, location_certainty: "precise", period: { start: 762, end: null, note: "Capital of the caliphate except during the Samarra years (836–892)." }, polity_id: "civ_abbasid", description: "Founded by al-Mansur in 762; the greatest city of the Islamic world and the market that drew the Gulf's imports upriver from Basra.", evidence_status: "established", sources: ["src_kennedy_caliphates"], scenario_ids: SIRAF },
  { id: "stl_samarra", name: "Samarra", kind: "capital", latitude: 34.2, longitude: 43.88, location_certainty: "precise", period: { start: 836, end: 892 }, polity_id: "civ_abbasid", description: "The caliphs' residence from 836 to 892, built for the Turkish guard regiments.", evidence_status: "established", sources: ["src_kennedy_caliphates"], scenario_ids: SIRAF },
  { id: "stl_shiraz", name: "Shiraz", kind: "city", latitude: 29.6, longitude: 52.53, location_certainty: "precise", period: { start: 693, end: null }, polity_id: "civ_abbasid", description: "Provincial capital of Fars, Siraf's hinterland, and the road-head for goods landed at the port.", evidence_status: "established", sources: ["src_whitehouse_siraf", "src_kennedy_caliphates"], scenario_ids: SIRAF },
  { id: "stl_mansura", name: "al-Mansura", kind: "capital", latitude: 25.88, longitude: 68.78, location_certainty: "approximate", period: { start: 734, end: 1026, approximate: true }, polity_id: "civ_abbasid_sind", description: "Capital of Arab Sind, inland from Daybul on the Indus.", evidence_status: "scholarly_interpretation", sources: ["src_wink_al_hind"], scenario_ids: SIRAF },
  { id: "stl_mecca", name: "Mecca", kind: "religious_centre", latitude: 21.42, longitude: 39.83, location_certainty: "precise", period: { start: 630, end: null }, polity_id: null, description: "The pilgrimage city; its yearly gathering was a market for goods from the Indian Ocean and the Mediterranean.", evidence_status: "established", sources: ["src_kennedy_caliphates"], scenario_ids: [...SIRAF, ...KILWA, ...PORTUGAL] },
  // Fourteenth century
  { id: "stl_great_zimbabwe", name: "Great Zimbabwe", kind: "inland_centre", latitude: -20.27, longitude: 30.93, location_certainty: "precise", period: { start: 1100, end: 1450, approximate: true }, polity_id: null, description: "The stone-built capital of the plateau state whose gold reached Sofala and Kilwa; Kilwa coins and Chinese ceramics have been found there.", evidence_status: "established", sources: ["src_pearson_1998", "src_sutton_1998"], scenario_ids: KILWA },
  { id: "stl_taizz", name: "Taʿizz", kind: "capital", latitude: 13.58, longitude: 44.02, location_certainty: "precise", period: { start: 1229, end: 1454 }, polity_id: "civ_rasulid", description: "The Rasulid capital in the highlands above Aden.", evidence_status: "established", sources: ["src_margariti_aden"], scenario_ids: [...KILWA, ...MING] },
  { id: "stl_zabid", name: "Zabid", kind: "city", latitude: 14.2, longitude: 43.32, location_certainty: "precise", period: { start: 819, end: null }, polity_id: "civ_rasulid", description: "The Tihama's chief town and a seat of learning under the Rasulids.", evidence_status: "established", sources: ["src_margariti_aden"], scenario_ids: [...SIRAF, ...KILWA] },
  { id: "stl_delhi", name: "Delhi", kind: "capital", latitude: 28.65, longitude: 77.23, location_certainty: "precise", period: { start: 1206, end: null }, polity_id: "civ_delhi_tughluq", description: "Capital of the sultanate; Ibn Battuta served here as a judge from 1334 to 1341.", evidence_status: "established", sources: ["src_jackson_delhi", "src_ibn_battuta_gibb"], scenario_ids: KILWA },
  // Fifteenth century: Venice
  { id: "stl_milan", name: "Milan", kind: "capital", latitude: 45.46, longitude: 9.19, location_certainty: "precise", period: { start: 1395, end: null }, polity_id: null, description: "Capital of the Visconti and then Sforza dukes, Venice's adversary in the Wars in Lombardy.", evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE },
  { id: "stl_lodi", name: "Lodi", kind: "city", latitude: 45.31, longitude: 9.5, location_certainty: "precise", period: { start: 1454, end: 1454 }, polity_id: null, description: "Where Venice and Milan made peace on 9 April 1454.", evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE },
  { id: "stl_florence", name: "Florence", kind: "city", latitude: 43.77, longitude: 11.25, location_certainty: "precise", period: { start: 1400, end: null }, polity_id: null, description: "Venice's ally against Milan from 1425 and a rival in the cloth and banking trades.", evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE },
  { id: "stl_rome", name: "Rome", kind: "religious_centre", latitude: 41.9, longitude: 12.5, location_certainty: "precise", period: { start: 1420, end: null }, polity_id: null, description: "Seat of the papacy after its return in 1420; the alum of Tolfa, found in 1462, lay in its territory.", evidence_status: "established", sources: ["src_ashtor_1983"], scenario_ids: VENICE },
  { id: "stl_cairo", name: "Cairo", kind: "capital", latitude: 30.04, longitude: 31.24, location_certainty: "precise", period: { start: 1250, end: 1517 }, polity_id: "civ_mamluk", description: "The Mamluk capital, where the sultan's spice stocks and the Kārimī merchants set the prices the Venetians paid at Alexandria.", evidence_status: "established", sources: ["src_ashtor_1983"], scenario_ids: [...VENICE, ...PORTUGAL] },
  { id: "stl_damascus", name: "Damascus", kind: "city", latitude: 33.51, longitude: 36.29, location_certainty: "precise", period: { start: 1260, end: 1517 }, polity_id: "civ_mamluk", description: "The Syrian capital whose markets supplied Beirut with cotton, silk and spices.", evidence_status: "established", sources: ["src_ashtor_1983"], scenario_ids: VENICE },
  { id: "stl_edirne", name: "Adrianople (Edirne)", kind: "capital", latitude: 41.68, longitude: 26.56, location_certainty: "precise", period: { start: 1369, end: 1453, approximate: true }, polity_id: "civ_ottoman_early", description: "The Ottoman capital in Europe until the conquest of Constantinople.", evidence_status: "established", sources: ["src_nicol_1988"], scenario_ids: VENICE },
  { id: "stl_nuremberg", name: "Nuremberg", kind: "city", latitude: 49.45, longitude: 11.08, location_certainty: "precise", period: { start: 1400, end: null }, polity_id: null, description: "A centre of the south German metal and merchant houses that traded through the Fondaco dei Tedeschi.", evidence_status: "established", sources: ["src_lane_1973"], scenario_ids: VENICE },
  // Fifteenth century: Melaka
  { id: "stl_trowulan", name: "Trowulan", kind: "capital", latitude: -7.56, longitude: 112.38, location_certainty: "approximate", period: { start: 1293, end: 1500, approximate: true }, polity_id: "civ_majapahit", description: "The inland capital of Majapahit, identified with the Trowulan site in East Java.", evidence_status: "scholarly_interpretation", sources: ["src_reid_1988"], scenario_ids: [...MELAKA, ...MING] },
  { id: "stl_vijayanagara", name: "Vijayanagara", kind: "capital", latitude: 15.33, longitude: 76.46, location_certainty: "precise", period: { start: 1336, end: 1565 }, polity_id: "civ_vijayanagara", description: "The capital of the southern empire whose demand for horses and whose textiles fed the coastal trade.", evidence_status: "established", sources: ["src_reid_1988", "src_malekandathil_2010"], scenario_ids: [...MELAKA, ...PORTUGAL, ...MING] },
  { id: "stl_ava", name: "Ava", kind: "capital", latitude: 21.86, longitude: 95.98, location_certainty: "precise", period: { start: 1365, end: 1555 }, polity_id: null, description: "Capital of the upper Burmese kingdom at war with Pegu for much of the fifteenth century.", evidence_status: "established", sources: ["src_reid_1988"], scenario_ids: [...MELAKA, ...MING] },
  // Sixteenth century: Portugal
  { id: "stl_evora", name: "Évora", kind: "city", latitude: 38.57, longitude: -7.91, location_certainty: "precise", period: { start: 1500, end: null }, polity_id: "civ_portugal", description: "A favoured residence of the court under Manuel I and João III, away from Lisbon's plagues.", evidence_status: "established", sources: ["src_newitt_2005"], scenario_ids: PORTUGAL },
  { id: "stl_seville", name: "Seville", kind: "city", latitude: 37.39, longitude: -5.99, location_certainty: "precise", period: { start: 1503, end: null }, polity_id: null, description: "Seat of Castile's Casa de Contratación from 1503, Lisbon's rival as the gateway to the new oceans.", evidence_status: "established", sources: ["src_boxer_1969"], scenario_ids: PORTUGAL },
  { id: "stl_augsburg", name: "Augsburg", kind: "city", latitude: 48.37, longitude: 10.9, location_certainty: "precise", period: { start: 1500, end: null }, polity_id: null, description: "Home of the Welser, Fugger and Höchstetter houses that financed ships in the 1505 fleet and supplied the copper the Portuguese carried east.", evidence_status: "established", sources: ["src_subrahmanyam_1993"], scenario_ids: PORTUGAL },
  { id: "stl_bijapur", name: "Bijapur", kind: "capital", latitude: 16.83, longitude: 75.72, location_certainty: "precise", period: { start: 1490, end: 1686 }, polity_id: "civ_bijapur", description: "Capital of the Adil Shahi sultans, whose cavalry depended on horses landed at Goa.", evidence_status: "established", sources: ["src_subrahmanyam_1993"], scenario_ids: PORTUGAL },
  { id: "stl_ahmedabad", name: "Ahmedabad", kind: "capital", latitude: 23.02, longitude: 72.57, location_certainty: "precise", period: { start: 1411, end: 1573 }, polity_id: "civ_gujarat_sultanate", description: "Capital of the Gujarat sultans, whose cloth filled the ships of Cambay and Diu.", evidence_status: "established", sources: ["src_pearson_1987"], scenario_ids: PORTUGAL },
  // Seventeenth century: the Dutch East India Company
  { id: "stl_the_hague", name: "The Hague", kind: "capital", latitude: 52.08, longitude: 4.31, location_certainty: "precise", period: { start: 1588, end: null }, polity_id: "civ_dutch_republic", description: "Seat of the States General, which granted the Company its charter in 1602.", evidence_status: "established", sources: ["src_israel_1989"], scenario_ids: DUTCH },
  { id: "stl_edo", name: "Edo", kind: "capital", latitude: 35.68, longitude: 139.75, location_certainty: "precise", period: { start: 1603, end: 1868 }, polity_id: "civ_tokugawa", description: "The shogun's capital, to which the Company's chief at Hirado and later Dejima paid an annual court visit.", evidence_status: "established", sources: ["src_gaastra_2003"], scenario_ids: DUTCH },
  { id: "stl_agra", name: "Agra", kind: "capital", latitude: 27.18, longitude: 78.02, location_certainty: "precise", period: { start: 1556, end: 1648, approximate: true }, polity_id: "civ_mughal", description: "Mughal capital under Akbar, Jahangir and Shah Jahan until the move to Shahjahanabad (Delhi) in 1648; the Company kept an indigo factory here.", evidence_status: "established", sources: ["src_das_bruijn"], scenario_ids: DUTCH },
  { id: "stl_isfahan", name: "Isfahan", kind: "capital", latitude: 32.65, longitude: 51.68, location_certainty: "precise", period: { start: 1598, end: 1736 }, polity_id: "civ_safavid", description: "Shah Abbas's capital from 1598, where the Company negotiated its silk contracts.", evidence_status: "established", sources: ["src_glamann_1958"], scenario_ids: DUTCH },
  { id: "stl_golconda", name: "Golconda (Hyderabad)", kind: "capital", latitude: 17.38, longitude: 78.4, location_certainty: "precise", period: { start: 1518, end: 1687 }, polity_id: "civ_golconda", description: "Capital of the Qutb Shahi sultans, whose farmans governed the Masulipatnam factory.", evidence_status: "established", sources: ["src_das_bruijn"], scenario_ids: DUTCH },
  { id: "stl_karta", name: "Karta (Mataram)", kind: "capital", latitude: -7.83, longitude: 110.4, location_certainty: "approximate", period: { start: 1613, end: 1645, approximate: true }, polity_id: "civ_mataram", description: "Sultan Agung's court near present-day Yogyakarta, from which the sieges of Batavia were launched; its exact site is uncertain.", evidence_status: "scholarly_interpretation", sources: ["src_blusse_1986"], scenario_ids: DUTCH },
  { id: "stl_goa_estado", name: "Goa (Estado da Índia)", kind: "city", latitude: 15.5, longitude: 73.91, location_certainty: "precise", period: { start: 1530, end: 1961 }, polity_id: "civ_portugal", description: "Capital of the Portuguese Estado, blockaded by Company fleets almost every monsoon from 1636 to 1644.", evidence_status: "established", sources: ["src_boxer_1965"], scenario_ids: DUTCH },
  // Early fifteenth century: the Ming treasure fleets
  { id: "stl_nanjing", name: "Nanjing", kind: "capital", latitude: 32.06, longitude: 118.78, location_certainty: "precise", period: { start: 1368, end: 1420 }, polity_id: "civ_ming", description: "The Ming capital until 1421 and seat of the Longjiang shipyard; the fleets' envoys were received here.", evidence_status: "established", sources: ["src_dreyer_zheng_he"], scenario_ids: MING },
  { id: "stl_nanjing_secondary", name: "Nanjing (secondary capital)", kind: "city", latitude: 32.06, longitude: 118.78, location_certainty: "precise", period: { start: 1421, end: 1644 }, polity_id: "civ_ming", description: "Kept a shadow administration and the fleet's base after the court moved north.", evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING },
  { id: "stl_beijing_1421", name: "Beijing", kind: "capital", latitude: 39.9, longitude: 116.4, location_certainty: "precise", period: { start: 1421, end: 1644 }, polity_id: "civ_ming", description: "The Ming capital from the New Year of 1421.", evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING },
  { id: "stl_kyoto", name: "Kyoto", kind: "capital", latitude: 35.01, longitude: 135.77, location_certainty: "precise", period: { start: 794, end: 1868 }, polity_id: "civ_ashikaga", description: "Seat of the Ashikaga shoguns at Muromachi and of the imperial court.", evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING },
  { id: "stl_shuri", name: "Shuri", kind: "capital", latitude: 26.22, longitude: 127.72, location_certainty: "precise", period: { start: 1406, end: 1879, approximate: true }, polity_id: "civ_ryukyu", description: "Shō Hashi's capital above the port of Naha.", evidence_status: "established", sources: ["src_cambridge_ming_1988"], scenario_ids: MING },
  { id: "stl_vijaya", name: "Vijaya (Đồ Bàn)", kind: "capital", latitude: 13.9, longitude: 109.07, location_certainty: "precise", period: { start: 1000, end: 1471, approximate: true }, polity_id: "civ_champa", description: "The Cham capital behind Xinzhou, taken by Đại Việt in 1471.", evidence_status: "established", sources: ["src_ma_huan"], scenario_ids: MING },
  { id: "stl_kotte", name: "Kotte (Jayawardenapura)", kind: "capital", latitude: 6.9, longitude: 79.91, location_certainty: "precise", period: { start: 1412, end: 1597 }, polity_id: "civ_kotte", description: "Parakramabahu VI's capital from 1412.", evidence_status: "established", sources: ["src_levathes_1994"], scenario_ids: MING },
  { id: "stl_pandua", name: "Pandua", kind: "capital", latitude: 25.13, longitude: 88.16, location_certainty: "precise", period: { start: 1352, end: 1450, approximate: true }, polity_id: "civ_bengal_sultanate", description: "Capital of the Bengal sultans until the return to Gaur around 1450.", evidence_status: "scholarly_interpretation", sources: ["src_sen_2006"], scenario_ids: MING },
];
