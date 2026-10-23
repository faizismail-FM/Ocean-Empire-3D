import type { HistoricalFigure } from "../schemas";

export const HISTORICAL_FIGURES: HistoricalFigure[] = [
  {
    id: "fig_sulayman", name: "Sulaymān the Merchant", alternate_names: ["Sulaymān al-Tājir"], role: "Merchant and informant",
    period: { start: 851, end: 851, approximate: true }, polity_id: "civ_abbasid",
    summary: "The merchant to whom the first part of the Accounts of China and India (c. 851) is traditionally attributed. Whether he authored the text or was one of several informants is debated.",
    evidence_status: "uncertain", sources: ["src_abu_zayd"],
  },
  {
    id: "fig_abu_zayd", name: "Abū Zayd al-Sīrāfī", alternate_names: ["Abu Zayd Hasan al-Sirafi"], role: "Author and compiler",
    period: { start: 900, end: 930, approximate: true }, polity_id: "civ_abbasid",
    summary: "A native of Siraf who, in the early tenth century, supplemented the earlier Accounts with reports on the Guangzhou massacre of 879, Indian Ocean trade and the ambergris and pearl trades.",
    evidence_status: "established", sources: ["src_abu_zayd"],
  },
  {
    id: "fig_ibn_khurradadhbih", name: "Ibn Khurradādhbih", alternate_names: ["Ibn Khordadbeh"], role: "Geographer and director of posts",
    period: { start: 820, end: 912, approximate: true }, polity_id: "civ_abbasid",
    summary: "Abbasid official whose Book of Routes and Realms (c. 870) is the earliest surviving Arabic administrative geography, including the sea route to India and China.",
    evidence_status: "established", sources: ["src_ibn_khurradadhbih"],
  },
  {
    id: "fig_mutawakkil", name: "al-Mutawakkil", alternate_names: ["Jaʿfar ibn al-Muʿtaṣim"], role: "Abbasid caliph (847–861)",
    period: { start: 847, end: 861 }, polity_id: "civ_abbasid",
    summary: "Caliph at Samarra when the campaign begins; his assassination by Turkish guards in 861 opened a decade of political instability.",
    evidence_status: "established", sources: ["src_kennedy_caliphates"],
  },
  {
    id: "fig_parameswara", name: "Parameswara", alternate_names: ["Iskandar Shah (in some sources)", "Bai-li-mi-su-la (Ming records)"], role: "Founder and first ruler of Melaka",
    period: { start: 1390, end: 1414, approximate: true }, polity_id: "civ_melaka",
    summary: "A Palembang prince who founded Melaka around 1400 and visited the Ming court in 1411. Whether he converted to Islam and took the name Iskandar Shah, or whether that was his son, is disputed.",
    evidence_status: "scholarly_interpretation", sources: ["src_andaya_malaysia", "src_sejarah_melayu", "src_wolters_1970"],
  },
  {
    id: "fig_mansur_shah", name: "Sultan Mansur Shah", alternate_names: ["Mansur Syah"], role: "Sultan of Melaka (c. 1459–1477)",
    period: { start: 1459, end: 1477, approximate: true }, polity_id: "civ_melaka",
    summary: "Ruler during Melaka's expansion over the peninsula and eastern Sumatra; portrayed in the Sejarah Melayu as a patron of Islamic learning and court culture.",
    evidence_status: "scholarly_interpretation", sources: ["src_andaya_malaysia", "src_sejarah_melayu"],
  },
  {
    id: "fig_tun_perak", name: "Tun Perak", alternate_names: [], role: "Bendahara (chief minister) of Melaka",
    period: { start: 1456, end: 1498, approximate: true }, polity_id: "civ_melaka",
    summary: "Bendahara under four sultans, credited by the Sejarah Melayu with repelling Siamese attacks and directing Melaka's expansion.",
    evidence_status: "scholarly_interpretation", sources: ["src_andaya_malaysia", "src_sejarah_melayu"],
  },
  {
    id: "fig_zheng_he", name: "Zheng He", alternate_names: ["Cheng Ho", "Ma He"], role: "Ming admiral",
    period: { start: 1371, end: 1433, approximate: true }, polity_id: "civ_ming",
    summary: "Muslim eunuch admiral who commanded seven Ming expeditions (1405–1433) to Southeast Asia, India, Arabia and East Africa.",
    evidence_status: "established", sources: ["src_dreyer_zheng_he"],
  },
  {
    id: "fig_ma_huan", name: "Ma Huan", alternate_names: [], role: "Interpreter and author",
    period: { start: 1380, end: 1460, approximate: true }, polity_id: "civ_ming",
    summary: "Interpreter on three of Zheng He's voyages; his Yingya Shenglan (1433) describes Melaka, Pasai, Calicut and other ports.",
    evidence_status: "established", sources: ["src_ma_huan"],
  },
  {
    id: "fig_tome_pires", name: "Tomé Pires", alternate_names: [], role: "Portuguese apothecary and author",
    period: { start: 1465, end: 1540, approximate: true }, polity_id: null,
    summary: "Wrote the Suma Oriental at Melaka and in India in 1512–1515, the most detailed European account of the Melaka trade; later led a failed embassy to China.",
    evidence_status: "established", sources: ["src_pires_suma"],
  },
  {
    id: "fig_albuquerque", name: "Afonso de Albuquerque", alternate_names: [], role: "Portuguese governor of India",
    period: { start: 1453, end: 1515 }, polity_id: null,
    summary: "Captured Goa (1510) and Melaka (1511) to establish Portuguese control over the Indian Ocean spice routes.",
    evidence_status: "established", sources: ["src_reid_1993", "src_andaya_malaysia"],
  },
];
