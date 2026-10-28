import type { HistoricalSource } from "../schemas";

/**
 * Bibliography for every historical claim in the game. Records were first compiled from
 * the implementer's knowledge of the literature; the entries that were recorded from
 * memory were then checked against library catalogues, publisher pages and published
 * reviews (October 2026), and the checked details are noted on each entry. No citation
 * here is invented. See docs/RESEARCH_NOTES.md for what was verified and how.
 */

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
    source_type: "archaeological_report", url_or_reference: "Iran 6 (1968), pp. 1–22; further interim reports in Iran 7–12 (1969–1974)", related_records: ["port_siraf", "evt_siraf_earthquake"],
    notes: "Volume and page range confirmed against bibliographic listings; Whitehouse's excavation notebooks are also online at the Corning Museum of Glass.",
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
    source_type: "archaeological_report", url_or_reference: "Linden Soft Verlag, Aichwald, 2013; 552 pp. with CD; ISBN 978-3-929290-39-4", related_records: ["port_mantai", "civ_anuradhapura"],
    notes: "Publisher, year, extent and ISBN confirmed from WorldCat and the reviews in Antiquity and the Journal of Islamic Archaeology. Reports the 1980–1984 excavations, cut short by the civil war.",
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
    source_type: "book", url_or_reference: "Primus Books, Delhi, 2010; 211 pp.; ISBN 93-80607-01-6", related_records: ["port_kollam", "civ_chera_venad", "good_pepper"],
    notes: "Publisher and extent confirmed from WorldCat and the Itinerario review. Some reviews give the subtitle as 'Trade, Religion and Politics'; the publisher uses 'Polity'. A revised paperback appeared in 2013.",
  },
  {
    id: "src_narayanan_perumals", title: "Perumals of Kerala: Brahmin Oligarchy and Ritual Monarchy",
    author_or_institution: "M. G. S. Narayanan", publication_year: 2013,
    source_type: "book", url_or_reference: "CosmoBooks, Thrissur, 2013 (revised edition, 512 pp.; ISBN 81-88765-07-4); first published 1996", related_records: ["civ_chera_venad", "port_kollam", "evt_tharisappalli_plates"],
    notes: "The 2013 edition is confirmed from library catalogues. Sources disagree on the publisher of the 1996 edition (Calicut University Press or Current Books, Thrissur); the 2013 edition is the one cited.",
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
    source_type: "book", url_or_reference: "Cornell University Press, Ithaca, 1993 (Asia, East by South series), pp. 69–90", related_records: ["civ_melaka", "tech_shahbandar", "port_melaka"],
    notes: "Volume confirmed from the publisher's catalogue record; the page range rests on a single reading-list citation and should be checked against the table of contents when the book is to hand.",
  },
  {
    id: "src_winstedt_maritime_laws", title: "The Maritime Laws of Malacca",
    author_or_institution: "R. O. Winstedt and P. E. de Josselin de Jong", publication_year: 1956,
    source_type: "journal_article", url_or_reference: "Journal of the Malayan Branch of the Royal Asiatic Society 29(3), August 1956, pp. 22–59", related_records: ["tech_maritime_code"],
    notes: "Issue and page range confirmed from several secondary citations; one stray citation gives pp. 28–49 and is treated as an error. The Royal Asiatic Society holds a manuscript of the laws dated AH 1066 / AD 1656 presented by Winstedt.",
  },
  {
    id: "src_geniza_kalah", title: "Kalah (place entry)",
    author_or_institution: "Princeton Geniza Lab, Princeton University", publication_year: null,
    source_type: "institution", url_or_reference: "https://geniza.princeton.edu/en/places/kalah/", related_records: ["port_kalah"],
    notes: "Summarises the location debate: scholars have argued over Kalah's site since 1718 and fall into three camps, two of them placing it between Phuket and Klang; Goitein's identification with Kedah is described as somewhat arbitrary.",
  },
  {
    id: "src_wilkinson_1974", title: "Agricultural Decline in the Siraf Region, Iran",
    author_or_institution: "T. J. Wilkinson", publication_year: 1974,
    source_type: "journal_article", url_or_reference: "Paléorient 2(1); doi:10.3406/paleo.1974.4177", related_records: ["evt_siraf_earthquake", "port_siraf"],
    notes: "Dates the earthquake to 977 and describes the diversion of trade to Qais (Kish); a 2020 geoarchaeological study instead attributes the decline to sea-level rise and coastal erosion between about 850 and 1000.",
  },
  // Fourteenth-century Swahili coast
  {
    id: "src_ibn_battuta_gibb", title: "The Travels of Ibn Baṭṭūṭa, A.D. 1325–1354, Volume II",
    author_or_institution: "Ibn Baṭṭūṭa; translated with revisions and notes by H. A. R. Gibb", publication_year: 1962,
    source_type: "primary_source", url_or_reference: "Hakluyt Society, second series no. 117, Cambridge University Press; East Africa, Aden, Hormuz and Qalhat fall in this volume", related_records: ["fig_ibn_battuta", "evt_ibn_battuta_coast", "port_kilwa", "port_mogadishu", "port_mombasa_1330", "port_aden_1330", "port_hormuz_jarun", "port_qalhat", "fig_hasan_ibn_sulayman"],
    notes: "Recorded from the implementer's knowledge of the edition (four volumes 1958–1994, index 2000) and not re-checked against a catalogue in October 2026. The traveller's chronology for 1330–1332 is internally inconsistent; the 1331 date for the coast is the usual reconstruction.",
  },
  {
    id: "src_chittick_kilwa", title: "Kilwa: An Islamic Trading City on the East African Coast",
    author_or_institution: "H. Neville Chittick, British Institute in Eastern Africa", publication_year: 1974,
    source_type: "archaeological_report", url_or_reference: "BIEA Memoir 5, Nairobi, 2 vols (I: History and archaeology; II: The finds), xviii + 514 pp.", related_records: ["port_kilwa", "civ_kilwa", "evt_husuni_kubwa", "good_glass_beads", "tech_kilwa_coral_warehouses"],
    notes: "Publication details confirmed against catalogue records and the reviews in the Journal of African History and Antiquity (October 2026).",
  },
  {
    id: "src_sutton_1998", title: "Kilwa: A History of the Ancient Swahili Town with a Guide to the Monuments of Kilwa Kisiwani and Adjacent Islands",
    author_or_institution: "John E. G. Sutton", publication_year: 1998,
    source_type: "journal_article", url_or_reference: "Azania 33(1), pp. 113–169; doi:10.1080/00672709809511466", related_records: ["port_kilwa", "civ_kilwa", "evt_hasan_death", "tech_kilwa_gold_assay", "good_sofala_gold"],
    notes: "Volume, pages and DOI confirmed (October 2026). Revises Chittick's chronology of the sultans and buildings.",
  },
  {
    id: "src_kilwa_chronicle", title: "Kitāb al-Sulwa fī Akhbār Kulwa (the Kilwa Chronicle)",
    author_or_institution: "Anonymous, Kilwa; Arabic manuscript SOAS MS 53501a; English translation in Freeman-Grenville (1962)", publication_year: null,
    source_type: "primary_source", url_or_reference: "Composed c. 1520–1530; Portuguese version in João de Barros, Da Ásia (1552)", related_records: ["civ_kilwa", "port_sofala", "evt_hasan_death", "fig_hasan_ibn_sulayman"],
    notes: "A sixteenth-century dynastic history; valuable for the sequence of rulers, unreliable for exact dates and for events two centuries earlier.",
  },
  {
    id: "src_freeman_grenville_1962", title: "The East African Coast: Select Documents from the First to the Earlier Nineteenth Century",
    author_or_institution: "G. S. P. Freeman-Grenville (ed.)", publication_year: 1962,
    source_type: "primary_source", url_or_reference: "Clarendon Press, Oxford, viii + 314 pp.; reprinted 1966", related_records: ["civ_mogadishu", "port_sofala", "good_tortoiseshell", "good_iron_bars", "evt_ibn_battuta_coast"],
    notes: "Confirmed against the review in Africa and catalogue records (October 2026). Its translations of Chinese documents have been criticised.",
  },
  {
    id: "src_pearson_1998", title: "Port Cities and Intruders: The Swahili Coast, India, and Portugal in the Early Modern Era",
    author_or_institution: "Michael N. Pearson", publication_year: 1998,
    source_type: "book", url_or_reference: "Johns Hopkins University Press, Baltimore (Johns Hopkins Symposia in Comparative History 23), x + 202 pp.", related_records: ["good_sofala_gold", "good_indian_cotton", "port_sofala", "tech_kilwa_monsoon"],
    notes: "Confirmed against catalogue records and the Journal of World History review (October 2026).",
  },
  {
    id: "src_kusimba_1999", title: "The Rise and Fall of Swahili States",
    author_or_institution: "Chapurukha M. Kusimba", publication_year: 1999,
    source_type: "book", url_or_reference: "AltaMira Press, Walnut Creek, 237 pp.", related_records: ["civ_mombasa_14c", "port_mombasa_1330", "good_iron_bars"],
    notes: "Confirmed against the Antiquity review (October 2026).",
  },
  {
    id: "src_swahili_world_2018", title: "The Swahili World",
    author_or_institution: "Stephanie Wynne-Jones and Adria LaViolette (eds.)", publication_year: 2018,
    source_type: "book", url_or_reference: "Routledge, Abingdon and New York (Routledge Worlds), ISBN 978-1-138-91346-2", related_records: ["civ_kilwa", "civ_mogadishu", "civ_zanzibar_14c", "port_zanzibar_1330", "good_glass_beads"],
    notes: "Confirmed against the publisher's page and the Antiquity review (October 2026).",
  },
  {
    id: "src_gilbert_mtepe_1998", title: "The Mtepe: Regional Trade and the Late Survival of Sewn Ships in East African Waters",
    author_or_institution: "Erik Gilbert", publication_year: 1998,
    source_type: "journal_article", url_or_reference: "International Journal of Nautical Archaeology 27(1), pp. 43–50", related_records: ["ship_mtepe", "tech_kilwa_sewn_hull"],
    notes: "Citation confirmed from bibliographies (October 2026); argues that the sewn tradition survived into the twentieth century.",
  },
  {
    id: "src_iranica_hormuz", title: "Hormuz ii. Islamic Period (Encyclopaedia Iranica)",
    author_or_institution: "Encyclopaedia Iranica", publication_year: null,
    source_type: "reference_work", url_or_reference: "https://iranicaonline.org/articles/hormuz-ii", related_records: ["civ_hormuz", "port_hormuz_jarun", "port_qalhat"],
    notes: "Dates the move to Jarun to about the end of the thirteenth century, following Abu'l-Fida.",
  },
  {
    id: "src_jackson_delhi", title: "The Delhi Sultanate: A Political and Military History",
    author_or_institution: "Peter Jackson", publication_year: 1999,
    source_type: "book", url_or_reference: "Cambridge University Press (Cambridge Studies in Islamic Civilization)", related_records: ["civ_delhi_tughluq", "port_cambay_1330", "evt_gujarat_revolt"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026.",
  },
  // Fifteenth-century Venice
  {
    id: "src_lane_1973", title: "Venice: A Maritime Republic",
    author_or_institution: "Frederic C. Lane", publication_year: 1973,
    source_type: "book", url_or_reference: "Johns Hopkins University Press, Baltimore", related_records: ["civ_venice", "port_venice", "tech_mude", "evt_mocenigo_oration", "evt_lombardy_war", "evt_ottoman_war_1463"],
    notes: "Confirmed against the publisher's author listing (October 2026).",
  },
  {
    id: "src_lane_1934", title: "Venetian Ships and Shipbuilders of the Renaissance",
    author_or_institution: "Frederic C. Lane", publication_year: 1934,
    source_type: "book", url_or_reference: "Johns Hopkins Press, Baltimore; reprinted 1992", related_records: ["ship_great_galley", "ship_cog", "ship_barca", "tech_arsenale", "good_timber_adriatic"],
    notes: "Confirmed against the publisher's page and HathiTrust record (October 2026).",
  },
  {
    id: "src_lane_1944", title: "Andrea Barbarigo, Merchant of Venice, 1418–1449",
    author_or_institution: "Frederic C. Lane", publication_year: 1944,
    source_type: "book", url_or_reference: "Johns Hopkins Press, Baltimore; reprinted Octagon Books, New York, 1967", related_records: ["fig_barbarigo", "tech_double_entry", "tech_marine_insurance", "port_bruges"],
    notes: "Confirmed against catalogue records (October 2026).",
  },
  {
    id: "src_ashtor_1983", title: "Levant Trade in the Later Middle Ages",
    author_or_institution: "Eliyahu Ashtor", publication_year: 1983,
    source_type: "book", url_or_reference: "Princeton University Press, xxii + 599 pp., ISBN 0-691-05386-3", related_records: ["civ_mamluk", "port_alexandria_1420", "port_beirut", "evt_barsbay_monopoly", "evt_barsbay_death", "good_levant_spices", "good_cotton_syria"],
    notes: "Confirmed against library catalogue records and the MESA review (October 2026).",
  },
  {
    id: "src_stockly_1995", title: "Le système de l'Incanto des galées du marché à Venise (fin XIIIe – milieu XVe siècle)",
    author_or_institution: "Doris Stöckly", publication_year: 1995,
    source_type: "book", url_or_reference: "Brill, Leiden (The Medieval Mediterranean 5)", related_records: ["tech_mude", "ship_great_galley", "route_venice_alexandria_15c", "route_venice_beirut_15c"],
    notes: "Confirmed against the publisher's listing (October 2026); the title's preposition appears as 'à Venise' in the catalogue.",
  },
  {
    id: "src_nicol_1988", title: "Byzantium and Venice: A Study in Diplomatic and Cultural Relations",
    author_or_institution: "Donald M. Nicol", publication_year: 1988,
    source_type: "book", url_or_reference: "Cambridge University Press; paperback 1992", related_records: ["civ_byzantium_late", "port_constantinople", "evt_thessalonica_venice", "evt_thessalonica_1430", "evt_constantinople_1453", "evt_venice_ottoman_1454"],
    notes: "Confirmed against catalogue records (October 2026).",
  },
  {
    id: "src_crouzet_pavan_2002", title: "Venice Triumphant: The Horizons of a Myth",
    author_or_institution: "Élisabeth Crouzet-Pavan, translated by Lydia G. Cochrane", publication_year: 2002,
    source_type: "book", url_or_reference: "Johns Hopkins University Press, Baltimore, xxi + 386 pp. (French original 1999)", related_records: ["civ_venice", "good_murano_glass", "good_grain", "fig_mocenigo"],
    notes: "Confirmed against the publisher's page (October 2026).",
  },
  {
    id: "src_necipoglu_2009", title: "Byzantium between the Ottomans and the Latins: Politics and Society in the Late Empire",
    author_or_institution: "Nevra Necipoğlu", publication_year: 2009,
    source_type: "book", url_or_reference: "Cambridge University Press", related_records: ["port_thessalonica", "evt_thessalonica_venice", "evt_thessalonica_1430"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026. Treats the Venetian period at Thessalonica (1423–1430) in detail.",
  },
  {
    id: "src_hill_cyprus", title: "A History of Cyprus, Volume II: The Frankish Period, 1192–1432",
    author_or_institution: "Sir George Hill", publication_year: 1948,
    source_type: "book", url_or_reference: "Cambridge University Press", related_records: ["civ_cyprus_lusignan", "port_famagusta", "evt_cyprus_1426", "good_sugar_cyprus"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026; it is the standard reference cited by the accounts of the 1426 campaign that were checked.",
  },
  {
    id: "src_querini_ramusio", title: "Viaggio del magnifico messer Piero Quirino, in Navigationi et viaggi, vol. II",
    author_or_institution: "Pietro Querini; printed by Giovanni Battista Ramusio", publication_year: 1559,
    source_type: "primary_source", url_or_reference: "Venice, 1559; a second account by the survivors Cristoforo Fioravante and Nicolò de Michiel is printed alongside it", related_records: ["fig_querini", "evt_querini_wreck"],
    notes: "The dates of departure (25 April 1431) and the landing at Røst (January 1432) were checked against the Via Querinissima cultural route documentation (October 2026); the Ramusio reference is from the implementer's knowledge.",
  },
  {
    id: "src_pryor_1988", title: "Geography, Technology, and War: Studies in the Maritime History of the Mediterranean, 649–1571",
    author_or_institution: "John H. Pryor", publication_year: 1988,
    source_type: "book", url_or_reference: "Cambridge University Press (Past and Present Publications)", related_records: ["tech_portolan"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026. Describes the Mediterranean's winds and currents and their effect on sailing routes.",
  },
  // Sixteenth-century Portuguese expansion
  {
    id: "src_subrahmanyam_1993", title: "The Portuguese Empire in Asia, 1500–1700: A Political and Economic History",
    author_or_institution: "Sanjay Subrahmanyam", publication_year: 1993,
    source_type: "book", url_or_reference: "Longman, London, 1993; second edition Wiley-Blackwell, 2012", related_records: ["civ_portugal", "port_lisbon", "port_goa", "evt_pepper_monopoly_1506", "evt_diu_1509", "tech_cartaz", "ship_nau"],
    notes: "The 2012 second edition (Wiley-Blackwell) is confirmed against publisher and bookseller listings (October 2026); the 1993 Longman first edition is recorded from the implementer's knowledge.",
  },
  {
    id: "src_boxer_1969", title: "The Portuguese Seaborne Empire, 1415–1825",
    author_or_institution: "C. R. Boxer", publication_year: 1969,
    source_type: "book", url_or_reference: "Hutchinson, London, xxvi + 426 pp.", related_records: ["civ_portugal", "tech_casa_licence", "good_copper_european", "fig_joao_iii"],
    notes: "Confirmed against catalogue records (October 2026).",
  },
  {
    id: "src_diffie_winius_1977", title: "Foundations of the Portuguese Empire, 1415–1580",
    author_or_institution: "Bailey W. Diffie and George D. Winius", publication_year: 1977,
    source_type: "book", url_or_reference: "University of Minnesota Press, Minneapolis (Europe and the World in the Age of Expansion, vol. 1)", related_records: ["port_mina", "port_funchal", "good_gold_mina", "good_malagueta", "tech_roteiro", "tech_astrolabe", "ship_caravela"],
    notes: "Series and date confirmed from listings (October 2026); the publisher is recorded from the implementer's knowledge.",
  },
  {
    id: "src_pearson_1987", title: "The Portuguese in India",
    author_or_institution: "M. N. Pearson", publication_year: 1987,
    source_type: "book", url_or_reference: "The New Cambridge History of India I.1, Cambridge University Press, xviii + 178 pp., ISBN 0-521-25713-1", related_records: ["civ_cochin", "port_cochin", "port_calicut_1505", "port_diu", "evt_calicut_treaty_1513", "evt_diu_fort_1535"],
    notes: "Confirmed against catalogue records (October 2026).",
  },
  {
    id: "src_newitt_2005", title: "A History of Portuguese Overseas Expansion, 1400–1668",
    author_or_institution: "Malyn Newitt", publication_year: 2005,
    source_type: "book", url_or_reference: "Routledge, London and New York, xiv + 300 pp.", related_records: ["port_sofala_1505", "port_kilwa_1505", "port_mozambique_isl", "evt_kilwa_1505", "evt_sofala_fort_1505", "evt_kilwa_abandoned_1512", "fig_manuel_i"],
    notes: "Confirmed against the publisher's page and catalogue records (October 2026).",
  },
  {
    id: "src_barbosa_dames", title: "The Book of Duarte Barbosa: An Account of the Countries bordering on the Indian Ocean and their Inhabitants, written by Duarte Barbosa and completed about the year 1518",
    author_or_institution: "Duarte Barbosa; translated and edited by Mansel Longworth Dames", publication_year: 1918,
    source_type: "primary_source", url_or_reference: "Hakluyt Society, second series nos. 44 and 49, London, 1918–1921, 2 vols", related_records: ["port_cochin", "port_cannanore", "port_calicut_1505", "ship_malabar_parau", "good_ginger"],
    notes: "Volume I (1918, second series no. 44) confirmed from the digitised text (October 2026); the second volume's date is recorded from the implementer's knowledge.",
  },
  {
    id: "src_albuquerque_commentaries", title: "The Commentaries of the Great Afonso Dalboquerque, Second Viceroy of India",
    author_or_institution: "Brás de Albuquerque; translated and edited by Walter de Gray Birch", publication_year: 1875,
    source_type: "primary_source", url_or_reference: "Hakluyt Society, first series nos. 53, 55, 62 and 69, London, 1875–1884, 4 vols", related_records: ["port_goa", "port_hormuz_1505", "port_malacca_1511", "evt_goa_1510", "evt_malacca_1511", "evt_hormuz_1515"],
    notes: "Confirmed against catalogue records (October 2026). Written by Albuquerque's son from his father's letters; partisan but detailed.",
  },
  // Seventeenth-century Dutch expansion
  {
    id: "src_gaastra_2003", title: "The Dutch East India Company: Expansion and Decline",
    author_or_institution: "Femme S. Gaastra", publication_year: 2003,
    source_type: "book", url_or_reference: "Walburg Pers, Zutphen, 192 pp. (Dutch editions 1982, 1991)", related_records: ["civ_dutch_republic", "port_amsterdam", "port_batavia", "evt_voc_charter", "evt_batavia_1619", "tech_factorij"],
    notes: "Confirmed against bookseller and university listings (October 2026).",
  },
  {
    id: "src_boxer_1965", title: "The Dutch Seaborne Empire, 1600–1800",
    author_or_institution: "C. R. Boxer", publication_year: 1965,
    source_type: "book", url_or_reference: "Hutchinson, London", related_records: ["civ_tokugawa", "port_hirado", "port_nagasaki", "evt_amboyna_1623", "evt_dejima_1641", "ship_jacht"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026.",
  },
  {
    id: "src_israel_1989", title: "Dutch Primacy in World Trade, 1585–1740",
    author_or_institution: "Jonathan I. Israel", publication_year: 1989,
    source_type: "book", url_or_reference: "Clarendon Press, Oxford, xxi + 462 pp.", related_records: ["civ_dutch_republic", "civ_mughal", "evt_santa_catarina_1603", "evt_truce_1609", "tech_exchange_bank", "ship_fluyt"],
    notes: "Confirmed against catalogue records (October 2026).",
  },
  {
    id: "src_das_bruijn", title: "Dutch-Asiatic Shipping in the 17th and 18th Centuries",
    author_or_institution: "J. R. Bruijn, F. S. Gaastra and I. Schöffer (eds.)", publication_year: 1979,
    source_type: "reference_work", url_or_reference: "Martinus Nijhoff, The Hague, 1979–1987, 3 vols (Rijks Geschiedkundige Publicatiën, Grote Serie 165–167)", related_records: ["ship_retourschip", "tech_brouwer_route", "route_brouwer", "fig_brouwer"],
    notes: "Confirmed against the Bibliothèque nationale de France record (October 2026); the volumes list every Company voyage out and home.",
  },
  {
    id: "src_glamann_1958", title: "Dutch-Asiatic Trade, 1620–1740",
    author_or_institution: "Kristof Glamann", publication_year: 1958,
    source_type: "book", url_or_reference: "Danish Science Press, Copenhagen, and Martinus Nijhoff, The Hague, xi + 334 pp.; reprinted Nijhoff 1981", related_records: ["civ_golconda", "civ_safavid", "port_masulipatnam", "port_gamron", "port_mocha", "good_japanese_silver", "good_persian_silk", "good_indigo"],
    notes: "Confirmed against reviews in BSOAS and the Journal of Asian Studies and the Springer reprint record (October 2026).",
  },
  {
    id: "src_andaya_maluku_1993", title: "The World of Maluku: Eastern Indonesia in the Early Modern Period",
    author_or_institution: "Leonard Y. Andaya", publication_year: 1993,
    source_type: "book", url_or_reference: "University of Hawaii Press, Honolulu", related_records: ["port_amboina", "port_banda_neira", "port_ternate_1602", "evt_amboina_1605", "evt_banda_1621"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026.",
  },
  {
    id: "src_parthesius_2010", title: "Dutch Ships in Tropical Waters: The Development of the Dutch East India Company (VOC) Shipping Network in Asia 1595–1660",
    author_or_institution: "Robert Parthesius", publication_year: 2010,
    source_type: "book", url_or_reference: "Amsterdam University Press (Amsterdam Studies in the Dutch Golden Age)", related_records: ["ship_jacht", "ship_fluyt", "ship_retourschip"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026.",
  },
  {
    id: "src_blusse_1986", title: "Strange Company: Chinese Settlers, Mestizo Women and the Dutch in VOC Batavia",
    author_or_institution: "Leonard Blussé", publication_year: 1986,
    source_type: "book", url_or_reference: "Foris, Dordrecht (Verhandelingen van het KITLV 122)", related_records: ["port_batavia", "port_zeelandia", "ship_junk_batavia", "good_deerskins_taiwan"],
    notes: "Recorded from the implementer's knowledge of the literature and not re-checked against a catalogue in October 2026.",
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
