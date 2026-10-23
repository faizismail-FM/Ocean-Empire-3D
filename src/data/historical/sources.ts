import type { HistoricalSource } from "../schemas";

/**
 * Bibliography for every historical claim in the game. Records were compiled from the
 * implementer's knowledge of the literature without live library access; entries flagged
 * `verify_details` should have page numbers, editions and URLs checked before the
 * encyclopedia is presented as authoritative. No citation here is invented, but
 * bibliographic details may be imperfect. See docs/RESEARCH_NOTES.md.
 */
const VERIFY = "Bibliographic details recorded from memory during initial implementation; verify edition and pages.";

export const SOURCES: HistoricalSource[] = [
  // Indian Ocean & Abbasid-era maritime trade
  {
    id: "src_hourani", title: "Arab Seafaring in the Indian Ocean in Ancient and Early Medieval Times",
    author_or_institution: "George F. Hourani (expanded edition revised by John Carswell)", publication_year: 1995,
    source_type: "book", url_or_reference: "Princeton University Press (first edition 1951)", related_records: ["civ_abbasid", "ship_sewn_ocean", "port_siraf", "tech_monsoon_calendar", "good_teak"],
  },
  {
    id: "src_flecker_2001", title: "A ninth-century AD Arab or Indian shipwreck in Indonesia: first evidence for direct trade with China",
    author_or_institution: "Michael Flecker", publication_year: 2001,
    source_type: "journal_article", url_or_reference: "World Archaeology 32(3), pp. 335–354", related_records: ["ship_sewn_ocean", "evt_belitung_wreck", "good_chinese_ceramics"],
  },
  {
    id: "src_shipwrecked_2010", title: "Shipwrecked: Tang Treasures and Monsoon Winds",
    author_or_institution: "Regina Krahl, John Guy, J. Keith Wilson and Julian Raby (eds.), Arthur M. Sackler Gallery, Smithsonian Institution", publication_year: 2010,
    source_type: "museum_collection", url_or_reference: "Smithsonian Institution / National Heritage Board Singapore", related_records: ["evt_belitung_wreck", "good_chinese_ceramics", "ship_sewn_ocean"],
  },
  {
    id: "src_abu_zayd", title: "Accounts of China and India (Akhbār al-Ṣīn wa-l-Hind), in Two Arabic Travel Books",
    author_or_institution: "Abū Zayd al-Sīrāfī; edited and translated by Tim Mackintosh-Smith", publication_year: 2014,
    source_type: "primary_source", url_or_reference: "Library of Arabic Literature, New York University Press", related_records: ["fig_abu_zayd", "fig_sulayman", "evt_akhbar_compiled", "evt_guangzhou_879", "port_khanfu", "port_kalah", "route_gulf_china_9c"],
    notes: "The first book is traditionally associated with the merchant Sulaymān (c. 851); the second is Abū Zayd's continuation (early tenth century).",
  },
  {
    id: "src_whitehouse_siraf", title: "Excavations at Sīrāf: First Interim Report",
    author_or_institution: "David Whitehouse, British Institute of Persian Studies", publication_year: 1968,
    source_type: "archaeological_report", url_or_reference: "Iran 6, pp. 1–22 (further interim reports in Iran 7–12, 1969–1974)", related_records: ["port_siraf", "evt_siraf_earthquake"],
    notes: VERIFY,
  },
  {
    id: "src_chaudhuri_1985", title: "Trade and Civilisation in the Indian Ocean: An Economic History from the Rise of Islam to 1750",
    author_or_institution: "K. N. Chaudhuri", publication_year: 1985,
    source_type: "book", url_or_reference: "Cambridge University Press", related_records: ["scenario_siraf_850", "scenario_melaka_1460", "tech_monsoon_calendar"],
  },
  {
    id: "src_agius_2008", title: "Classic Ships of Islam: From Mesopotamia to the Indian Ocean",
    author_or_institution: "Dionisius A. Agius", publication_year: 2008,
    source_type: "book", url_or_reference: "Brill, Handbook of Oriental Studies", related_records: ["ship_sewn_ocean", "ship_sewn_coaster", "ship_sewn_large", "tech_sewn_hull"],
  },
  {
    id: "src_kennedy_caliphates", title: "The Prophet and the Age of the Caliphates: The Islamic Near East from the Sixth to the Eleventh Century",
    author_or_institution: "Hugh Kennedy", publication_year: 2016,
    source_type: "book", url_or_reference: "Routledge, 3rd edition (first edition Longman 1986)", related_records: ["civ_abbasid", "evt_samarra_capital", "evt_zanj_revolt", "civ_oman_ibadi", "fig_mutawakkil"],
  },
  {
    id: "src_ibn_khurradadhbih", title: "Kitāb al-Masālik wa-l-Mamālik (Book of Routes and Realms)",
    author_or_institution: "Ibn Khurradādhbih; edited by M. J. de Goeje", publication_year: 1889,
    source_type: "primary_source", url_or_reference: "Bibliotheca Geographorum Arabicorum VI, Brill", related_records: ["fig_ibn_khurradadhbih", "evt_routes_book", "route_gulf_china_9c"],
    notes: "Ninth-century administrative geography describing the sea route from the Gulf to India, Southeast Asia and China.",
  },
  {
    id: "src_popovic_zanj", title: "The Revolt of African Slaves in Iraq in the 3rd/9th Century",
    author_or_institution: "Alexandre Popovic, translated by Léon King", publication_year: 1999,
    source_type: "book", url_or_reference: "Markus Wiener Publishers (French original 1976)", related_records: ["evt_zanj_revolt", "evt_basra_sacked_871", "port_basra"],
  },
  {
    id: "src_chittick_manda", title: "Manda: Excavations at an Island Port on the Kenya Coast",
    author_or_institution: "Neville Chittick, British Institute in Eastern Africa", publication_year: 1984,
    source_type: "archaeological_report", url_or_reference: "British Institute in Eastern Africa, Memoir 9", related_records: ["port_manda", "civ_early_swahili"],
  },
  {
    id: "src_horton_middleton", title: "The Swahili: The Social Landscape of a Mercantile Society",
    author_or_institution: "Mark Horton and John Middleton", publication_year: 2000,
    source_type: "book", url_or_reference: "Blackwell Publishers", related_records: ["civ_early_swahili", "port_manda", "good_ivory", "good_mangrove"],
  },
  {
    id: "src_wink_al_hind", title: "Al-Hind: The Making of the Indo-Islamic World, Volume 1: Early Medieval India and the Expansion of Islam, 7th–11th Centuries",
    author_or_institution: "André Wink", publication_year: 1990,
    source_type: "book", url_or_reference: "Brill", related_records: ["port_daybul", "civ_abbasid_sind", "port_kollam"],
  },
  {
    id: "src_carswell_mantai", title: "Mantai: City by the Sea",
    author_or_institution: "John Carswell, Siran Deraniyagala and Alan Graham (eds.)", publication_year: 2013,
    source_type: "archaeological_report", url_or_reference: "Linden Soft Verlag", related_records: ["port_mantai", "civ_anuradhapura"], notes: VERIFY,
  },
  {
    id: "src_tibbetts_1979", title: "A Study of the Arabic Texts Containing Material on South-East Asia",
    author_or_institution: "G. R. Tibbetts", publication_year: 1979,
    source_type: "book", url_or_reference: "Royal Asiatic Society / E. J. Brill", related_records: ["port_kalah", "civ_srivijaya", "tech_stellar_navigation"],
  },
  {
    id: "src_wheatley_1961", title: "The Golden Khersonese: Studies in the Historical Geography of the Malay Peninsula before A.D. 1500",
    author_or_institution: "Paul Wheatley", publication_year: 1961,
    source_type: "book", url_or_reference: "University of Malaya Press", related_records: ["port_kalah", "civ_srivijaya", "port_melaka"],
  },
  {
    id: "src_udovitch_1970", title: "Partnership and Profit in Medieval Islam",
    author_or_institution: "Abraham L. Udovitch", publication_year: 1970,
    source_type: "book", url_or_reference: "Princeton University Press", related_records: ["tech_credit_instruments"],
  },
  {
    id: "src_margariti_aden", title: "Aden and the Indian Ocean Trade: 150 Years in the Life of a Medieval Arabian Port",
    author_or_institution: "Roxani Eleni Margariti", publication_year: 2007,
    source_type: "book", url_or_reference: "University of North Carolina Press", related_records: ["port_aden"],
    notes: "Focuses on the eleventh to thirteenth centuries; used here for background on Aden's role, not for ninth-century specifics.",
  },
  {
    id: "src_malekandathil_2010", title: "Maritime India: Trade, Religion and Polity in the Indian Ocean",
    author_or_institution: "Pius Malekandathil", publication_year: 2010,
    source_type: "book", url_or_reference: "Primus Books", related_records: ["port_kollam", "civ_chera_venad", "good_pepper"], notes: VERIFY,
  },
  {
    id: "src_narayanan_perumals", title: "Perumals of Kerala: Brahmin Oligarchy and Ritual Monarchy",
    author_or_institution: "M. G. S. Narayanan", publication_year: 2013,
    source_type: "book", url_or_reference: "CosmoBooks (revised edition; original 1996)", related_records: ["civ_chera_venad", "port_kollam", "evt_tharisappalli_plates"], notes: VERIFY,
  },
  {
    id: "src_wang_gungwu_nanhai", title: "The Nanhai Trade: The Early History of Chinese Trade in the South China Sea",
    author_or_institution: "Wang Gungwu", publication_year: 1958,
    source_type: "journal_article", url_or_reference: "Journal of the Malayan Branch of the Royal Asiatic Society 31(2)", related_records: ["port_khanfu", "civ_tang"],
  },
  // Melaka & Southeast Asia
  {
    id: "src_pires_suma", title: "The Suma Oriental of Tomé Pires: An Account of the East, from the Red Sea to Japan, written in Malacca and India in 1512–1515",
    author_or_institution: "Tomé Pires; translated and edited by Armando Cortesão", publication_year: 1944,
    source_type: "primary_source", url_or_reference: "Hakluyt Society, 2nd series, nos. 89–90", related_records: ["civ_melaka", "port_melaka", "tech_shahbandar", "ship_jong_large", "good_cloves", "good_nutmeg", "fig_tome_pires", "port_pasai", "port_cambay"],
    notes: "Written shortly after the Portuguese conquest; a detailed but partisan description of Melaka's trade in the preceding decades.",
  },
  {
    id: "src_ma_huan", title: "Ying-yai Sheng-lan: 'The Overall Survey of the Ocean's Shores' [1433]",
    author_or_institution: "Ma Huan; translated by J. V. G. Mills", publication_year: 1970,
    source_type: "primary_source", url_or_reference: "Hakluyt Society Extra Series 42, Cambridge University Press", related_records: ["fig_ma_huan", "port_melaka", "port_pasai", "port_calicut", "evt_zheng_he_voyages", "good_tin"],
  },
  {
    id: "src_reid_1988", title: "Southeast Asia in the Age of Commerce, 1450–1680. Volume One: The Lands below the Winds",
    author_or_institution: "Anthony Reid", publication_year: 1988,
    source_type: "book", url_or_reference: "Yale University Press", related_records: ["scenario_melaka_1460", "civ_melaka", "good_pepper", "good_rice", "ship_jong_large"],
  },
  {
    id: "src_reid_1993", title: "Southeast Asia in the Age of Commerce, 1450–1680. Volume Two: Expansion and Crisis",
    author_or_institution: "Anthony Reid", publication_year: 1993,
    source_type: "book", url_or_reference: "Yale University Press", related_records: ["scenario_melaka_1460", "evt_albuquerque_1511", "good_cloves"],
  },
  {
    id: "src_manguin_1980", title: "The Southeast Asian Ship: An Historical Approach",
    author_or_institution: "Pierre-Yves Manguin", publication_year: 1980,
    source_type: "journal_article", url_or_reference: "Journal of Southeast Asian Studies 11(2), pp. 266–276", related_records: ["ship_jong_small", "ship_jong_large", "ship_lancaran", "tech_large_jong"],
  },
  {
    id: "src_manguin_1993", title: "Trading Ships of the South China Sea: Shipbuilding Techniques and Their Role in the History of the Development of Asian Trade Networks",
    author_or_institution: "Pierre-Yves Manguin", publication_year: 1993,
    source_type: "journal_article", url_or_reference: "Journal of the Economic and Social History of the Orient 36(3), pp. 253–280", related_records: ["ship_junk_hybrid", "tech_hybrid_hull", "ship_jong_large"],
  },
  {
    id: "src_andaya_malaysia", title: "A History of Malaysia",
    author_or_institution: "Barbara Watson Andaya and Leonard Y. Andaya", publication_year: 2017,
    source_type: "book", url_or_reference: "Palgrave Macmillan, 3rd edition (first edition 1982)", related_records: ["civ_melaka", "fig_parameswara", "fig_mansur_shah", "fig_tun_perak", "evt_melaka_founding", "good_tin"],
  },
  {
    id: "src_wolters_1970", title: "The Fall of Śrīvijaya in Malay History",
    author_or_institution: "O. W. Wolters", publication_year: 1970,
    source_type: "book", url_or_reference: "Cornell University Press", related_records: ["civ_srivijaya", "port_palembang", "evt_melaka_founding"],
  },
  {
    id: "src_sejarah_melayu", title: "Sejarah Melayu or 'Malay Annals'",
    author_or_institution: "Anonymous court chronicle; translated by C. C. Brown", publication_year: 1952,
    source_type: "primary_source", url_or_reference: "Journal of the Malayan Branch of the Royal Asiatic Society 25(2–3)", related_records: ["fig_parameswara", "fig_mansur_shah", "fig_tun_perak", "civ_melaka"],
    notes: "A literary court chronicle compiled after Melaka's fall (the common recension dates to 1612); valuable for Malay self-representation, unreliable for exact dates.",
  },
  {
    id: "src_dreyer_zheng_he", title: "Zheng He: China and the Oceans in the Early Ming Dynasty, 1405–1433",
    author_or_institution: "Edward L. Dreyer", publication_year: 2007,
    source_type: "book", url_or_reference: "Pearson Longman, Library of World Biography", related_records: ["fig_zheng_he", "evt_zheng_he_voyages", "civ_ming", "ship_junk_hybrid"],
  },
  {
    id: "src_thomaz_1993", title: "The Malay Sultanate of Melaka",
    author_or_institution: "Luís Filipe F. R. Thomaz, in Anthony Reid (ed.), Southeast Asia in the Early Modern Era: Trade, Power, and Belief", publication_year: 1993,
    source_type: "book", url_or_reference: "Cornell University Press, pp. 69–90", related_records: ["civ_melaka", "tech_shahbandar", "port_melaka"], notes: VERIFY,
  },
  {
    id: "src_winstedt_maritime_laws", title: "The Maritime Laws of Malacca",
    author_or_institution: "R. O. Winstedt and P. E. de Josselin de Jong", publication_year: 1956,
    source_type: "journal_article", url_or_reference: "Journal of the Malayan Branch of the Royal Asiatic Society 29(3)", related_records: ["tech_maritime_code"], notes: VERIFY,
  },
  // Modern shipping
  {
    id: "src_unctad_rmt", title: "Review of Maritime Transport 2023",
    author_or_institution: "United Nations Conference on Trade and Development (UNCTAD)", publication_year: 2023,
    source_type: "institution", url_or_reference: "https://unctad.org/publication/review-maritime-transport-2023", related_records: ["scenario_modern", "feeder_1000", "panamax_4500", "ulcv_20000"],
  },
  {
    id: "src_levinson_box", title: "The Box: How the Shipping Container Made the World Smaller and the World Economy Bigger",
    author_or_institution: "Marc Levinson", publication_year: 2006,
    source_type: "book", url_or_reference: "Princeton University Press", related_records: ["scenario_modern", "feeder_1000"],
  },
  {
    id: "src_port_klang_authority", title: "Port Klang Authority – official website",
    author_or_institution: "Port Klang Authority (Lembaga Pelabuhan Klang)", publication_year: null,
    source_type: "institution", url_or_reference: "https://www.pka.gov.my", related_records: ["port_klang"],
  },
  {
    id: "src_mpa_singapore", title: "Maritime and Port Authority of Singapore – official website",
    author_or_institution: "Maritime and Port Authority of Singapore", publication_year: null,
    source_type: "institution", url_or_reference: "https://www.mpa.gov.sg", related_records: ["singapore"],
  },
  {
    id: "src_port_of_rotterdam", title: "Port of Rotterdam Authority – official website",
    author_or_institution: "Port of Rotterdam Authority", publication_year: null,
    source_type: "institution", url_or_reference: "https://www.portofrotterdam.com", related_records: ["rotterdam"],
  },
];

export function getSource(id: string): HistoricalSource | undefined {
  return SOURCES.find((s) => s.id === id);
}
