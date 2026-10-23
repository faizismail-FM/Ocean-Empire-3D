import type { HistoricalRoute } from "../schemas";

/** Documented trade routes drawn as dashed lines on the historical map layer. Waypoints are [lon, lat]. */
export const HISTORICAL_ROUTES: HistoricalRoute[] = [
  {
    id: "route_gulf_china_9c",
    name: "Gulf to Khanfu (ninth century)",
    description: "The stages described in the Accounts of China and India and by Ibn Khurradadhbih: Siraf, Muscat, Kūlam Malī (Kollam), Sri Lanka, the Nicobar/Andaman area, Kalah, Champa and Khanfu. Positions between named stages are approximate.",
    period: { start: 800, end: 900 },
    waypoints: [[52.34, 27.67], [58.6, 23.5], [62, 15.5], [76.59, 8.89], [80.5, 5.5], [93, 8], [100.3, 5.9], [104, 1.3], [109.5, 12.5], [113.26, 23.13]],
    evidence_status: "established",
    sources: ["src_abu_zayd", "src_ibn_khurradadhbih", "src_hourani"],
  },
  {
    id: "route_gulf_zanj_9c",
    name: "Gulf to the Zanj coast (ninth century)",
    description: "Omani and Sirafi voyages to the East African trading settlements, attested by Gulf ceramics found at Manda and other sites.",
    period: { start: 800, end: 1000 },
    waypoints: [[56.75, 24.35], [55.5, 13], [50, 4], [40.98, -2.27]],
    evidence_status: "established",
    sources: ["src_chittick_manda", "src_horton_middleton"],
  },
  {
    id: "route_cambay_melaka_15c",
    name: "Gujarat and Malabar to Melaka (fifteenth century)",
    description: "Cloth from Cambay and pepper from Calicut sailed with the north-east monsoon to Melaka; Pires describes the Gujarati fleet as the largest.",
    period: { start: 1400, end: 1511 },
    waypoints: [[72.62, 22.31], [75.78, 11.25], [77.8, 6.9], [90, 6], [97.6, 6.1], [102.25, 2.19]],
    evidence_status: "established",
    sources: ["src_pires_suma", "src_reid_1988"],
  },
  {
    id: "route_melaka_maluku_15c",
    name: "Melaka to Java and the Spice Islands",
    description: "Javanese and Malay jong carried rice and cloth east and spices west through the north-coast ports of Java.",
    period: { start: 1400, end: 1511 },
    waypoints: [[102.25, 2.19], [105.9, -2.3], [112.65, -7.16], [121, -7], [129.9, -4.53], [127.38, 0.79]],
    evidence_status: "established",
    sources: ["src_pires_suma", "src_reid_1993"],
  },
  {
    id: "route_melaka_china_15c",
    name: "Melaka to Guangzhou (tribute route)",
    description: "The South China Sea passage sailed by Melaka's tribute missions and by Chinese junks.",
    period: { start: 1405, end: 1511 },
    waypoints: [[102.25, 2.19], [104.6, 0.6], [106.5, 4], [111, 10.5], [114, 19], [113.26, 23.13]],
    evidence_status: "established",
    sources: ["src_dreyer_zheng_he", "src_ma_huan"],
  },
];
