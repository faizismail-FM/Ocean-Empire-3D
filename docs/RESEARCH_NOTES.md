# Research notes and verification status

The historical database in `src/data/historical` was compiled from the implementer's knowledge of the published literature, without live library or web access during implementation. In line with the design brief (Part 7.3), nothing here is presented as verified merely because it exists in the database. This file records what is well supported, what is interpretive, what has since been checked (October 2026, against library catalogues, publisher records, published reviews and reference works, with the sources named on each record), and what remains open because the scholarship itself is unsettled.

## Evidence ratings used

| Rating | Meaning |
| --- | --- |
| `established` | Widely accepted on documentary or archaeological evidence |
| `scholarly_interpretation` | Supported by evidence but dependent on historians' interpretation |
| `reconstruction` | A reasonable reconstruction made to make the game playable |
| `uncertain` | Disputed, incomplete or unverified |
| `fictional` | Gameplay invention, not a historical claim |

## Bibliography: verification record

No citation was invented. The six entries that were recorded from memory were checked in October 2026 against library catalogues, publisher records and published reviews; the checked details now appear on each entry in `sources.ts`.

| Entry | Result |
| --- | --- |
| Whitehouse, *Excavations at Sīrāf: First Interim Report* | Confirmed: *Iran* 6 (1968), pp. 1–22. Later interim reports in *Iran* 7–12. |
| Carswell, Deraniyagala & Graham (eds.), *Mantai: City by the Sea* | Confirmed: Linden Soft Verlag, Aichwald, 2013; 552 pp. with CD; ISBN 978-3-929290-39-4 (WorldCat; reviews in *Antiquity* and *Journal of Islamic Archaeology*). Google Books lists the Sri Lankan Archaeological Department as publisher; the catalogue record is followed. |
| Malekandathil, *Maritime India* | Confirmed: Primus Books, Delhi, 2010; 211 pp.; ISBN 93-80607-01-6 (WorldCat; *Itinerario* review). Some reviews give the subtitle as "Politics"; the publisher's "Polity" is used. |
| Narayanan, *Perumals of Kerala* | 2013 CosmoBooks (Thrissur) edition confirmed: 512 pp., ISBN 81-88765-07-4. The 1996 edition's publisher is given variously as Calicut University Press and Current Books; the 2013 edition is cited. |
| Thomaz, "The Malay Sultanate of Melaka" | Volume confirmed: Reid (ed.), *Southeast Asia in the Early Modern Era*, Cornell University Press, Ithaca, 1993. The page range 69–90 rests on one reading-list citation; check against the table of contents. |
| Winstedt & de Josselin de Jong, "The Maritime Laws of Malacca" | Confirmed: *JMBRAS* 29(3), August 1956, pp. 22–59 (several secondary citations; one stray citation gives 28–49). |

Two sources were added during the check: the Princeton Geniza Lab's place entry for Kalah (summary of the location debate) and Wilkinson's 1974 *Paléorient* article on the Siraf region.

### Kilwa and Venice campaigns (added October 2026)

The bibliography for the two campaigns added later was checked at the time of writing, with the result noted on each entry in `sources.ts`:

| Entry | Result |
| --- | --- |
| Chittick, *Kilwa* | Confirmed: BIEA Memoir 5, Nairobi, 1974, 2 vols, xviii + 514 pp. (catalogue records; reviews in *JAH* and *Antiquity*). |
| Sutton, "Kilwa: a history of the ancient Swahili town" | Confirmed: *Azania* 33(1), 1998, pp. 113–169, doi:10.1080/00672709809511466. |
| Freeman-Grenville, *The East African Coast: Select Documents* | Confirmed: Clarendon Press, 1962, viii + 314 pp.; reprinted 1966. |
| Pearson, *Port Cities and Intruders* | Confirmed: Johns Hopkins UP, 1998, x + 202 pp. |
| Kusimba, *The Rise and Fall of Swahili States* | Confirmed: AltaMira, 1999, 237 pp. |
| Wynne-Jones & LaViolette (eds.), *The Swahili World* | Confirmed: Routledge, 2018, ISBN 978-1-138-91346-2. |
| Gilbert, "The Mtepe" | Confirmed: *IJNA* 27(1), 1998, pp. 43–50. |
| Lane, *Venice: A Maritime Republic* (1973); *Venetian Ships and Shipbuilders* (1934); *Andrea Barbarigo* (1944) | Confirmed against the publisher's listings and HathiTrust. |
| Ashtor, *Levant Trade in the Later Middle Ages* | Confirmed: Princeton UP, 1983, xxii + 599 pp., ISBN 0-691-05386-3. |
| Stöckly, *Le système de l'Incanto des galées du marché à Venise* | Confirmed: Brill, 1995 (The Medieval Mediterranean); the catalogue title reads "à Venise". |
| Nicol, *Byzantium and Venice* | Confirmed: Cambridge UP, 1988; paperback 1992. |
| Crouzet-Pavan, *Venice Triumphant* | Confirmed: Johns Hopkins UP, 2002, xxi + 386 pp. |
| Gibb, *The Travels of Ibn Baṭṭūṭa*, vol. II (1962); Jackson, *The Delhi Sultanate* (1999); Necipoğlu, *Byzantium between the Ottomans and the Latins* (2009); Hill, *A History of Cyprus* II (1948); Querini in Ramusio (1559); Pryor, *Geography, Technology, and War* (1988) | Recorded from the implementer's knowledge of the literature and **not** re-checked against a catalogue; each entry says so in its notes. |

Dates checked at the same time: Ibn Battuta at Mogadishu, Mombasa and Kilwa (1331, with the traveller's own chronology noted as inconsistent); al-Hasan ibn Sulayman's reign (c. 1310–1333, with 1335 in some reconstructions); the move of Hormuz to Jarun (c. 1300); the fall of Thessalonica (29 March 1430); the Mamluk victory at Khirokitia (7 July 1426); Barsbay's pepper monopoly (1429) and death (1438); Querini's departure from Candia (25 April 1431) and landing at Røst (January 1432); Mocenigo's death (4 April 1423) and Foscari's election (15 April 1423); the Peace of Lodi (9 April 1454); the Venetian–Ottoman treaty (18 April 1454); the declaration of war of 28 July 1463.

## Claims that need further research

### Siraf, 850 CE
- **Kalah's location** is unresolved. Checked October 2026: the Princeton Geniza Lab summarises a debate running since 1718, with proposals along the peninsula's west coast from Phuket and Takuapa to Kedah and Klang; Goitein's Kedah identification is described there as somewhat arbitrary. The port stays at an approximate Kedah-coast position and flagged `disputed`; the note on the record now says so.
- **Aden in the ninth century**: checked October 2026. Margariti dates Aden's emergence as a major emporium to the ninth and tenth centuries, as the India trade shifted toward the Red Sea; Ibn Khurradādhbih's account of the Rādhānite route (846) runs through al-Qulzum and Jedda without naming Aden. The record stays `uncertain`, with the reasoning on the record.
- **Basra's medieval site**: the early city lay near modern al-Zubayr; coordinates are approximate.
- **Daybul = Banbhore**: checked October 2026. The identification rests on F. A. Khan's 1958–1965 excavations and philological arguments (Baluch, Mughal); earlier proposals were Karachi (Elliot) and Kakar Bukera (Haig, on a mistranslation of al-Balādhurī). A Pakistani–Italian–French team reopened Banbhore in 2010 after doubts about Khan's dating, and the 2019 *Sindh Antiquities* special issue still calls the question open. Coordinates stay approximate.
- **Manda**: the settlement's name in contemporary Arabic sources is unknown; "Manda" is the modern island name.
- **Star-altitude navigation** in the ninth century is inferred from later practice (the kamal and Ibn Mājid's manuals are 15th century); rated `uncertain`.
- **Ship classes**: only the Belitung wreck is excavated. The "large sewn-plank ship" and "coastal vessel" are reconstructions; the word "dhow" is avoided as anachronistic for the period (Agius 2008).
- **Ambergris and pearls** are mentioned by Abu Zayd; the quantities, prices and cargo-space values in the game are abstractions.
- **Siraf earthquake c. 977**: checked October 2026. Wilkinson (1974) dates the earthquake to 977 and treats it as the turning point after which trade moved to Qais; al-Muqaddasī, writing at the end of the century, still praised the houses while noting the exodus. A 2020 geoarchaeological study of the harbour instead attributes the decline to sea-level rise and coastal erosion between about 850 and 1000. The event is now rated `scholarly_interpretation` and both views are noted on it. It lies outside the campaign window.
- Casualty figures given by Abu Zayd for the 879 Guangzhou massacre are not independently verifiable and are not quoted as fact.

### Melaka, 1460 CE
- **Founding date** (c. 1400) is conventional; the first firm records are Ming entries of 1403–1405.
- **Regnal dates** of Mansur Shah (c. 1459–1477) and Tun Perak's ministry (1456–1498) derive from the Sejarah Melayu and later scholarship; checked October 2026 against *Britannica* and standard ruler lists, which give the same spans (Muzaffar Shah's death is placed "about 1459"). Kept as `scholarly_interpretation` because the chronicle is the ultimate source.
- **Parameswara / Iskandar Shah** identity question is noted in the figure entry.
- **Undang-Undang Laut Melaka** is traditionally placed in Mahmud Shah's reign; the game offers it as an acquirable capability rather than a dated event.
- **Ternate and Brunei** polities before 1500 are thinly documented; both are rated `uncertain`.
- **Ayutthaya and Pegu** lay inland; their map positions are the cities, reached by river.
- **Currency**: Melaka used tin coinage alongside gold, silver and Chinese cash; the game's "trade cash" is an abstract unit, not a historical price level.
- **Jong dimensions and capacities** follow Manguin's conservative estimates; Portuguese reports of much larger vessels are noted but not used for balance.

- **Abbasid reconquest of Oman, 893**: checked October 2026. The campaign of 280 AH / 893 CE under Muḥammad ibn Nūr, following the civil war that began with the deposition of Imam al-Ṣalt in 885, ended the Ibadi imamate and reincorporated much of Oman as an Abbasid province; Suhar's residents are reported to have fled in large numbers. Rated `established`; the game's fee increase at Suhar is the simulated consequence.

### Kilwa, 1330 CE
- **Regnal dates** of al-Hasan ibn Sulayman and his successors rest on the Kilwa Chronicle (written c. 1520–1530) and the coin series; the sultan's death is placed c. 1333 and rated `uncertain`.
- **Husuni Kubwa and the mosque extension** are dated to his reign by coins and architectural comparison (`scholarly_interpretation`).
- **Sofala**: the medieval town is not securely located; the marker is the later Portuguese Sofala. The chronicle's story of how Kilwa acquired Sofala is a later retrospective.
- **Zanzibar island**: Tumbatu and Kizimkazi are the documented medieval towns; which harbour served the trade in the 1330s is unknown, so the port is rated `uncertain` and its location `disputed`.
- **Black Death**: documented at Alexandria from autumn 1347 and in Yemen after 1351; its spread to the Swahili coast is unknown, so the event affects only Aden.
- **Enslaved people** were traded on this coast. The game does not represent them as cargo; the scenario's uncertainty note says so.
- **Ship classes** are reconstructions: no fourteenth-century Swahili hull has been excavated, and the mtepe is documented in detail only from the nineteenth and twentieth centuries.

### Venice, 1423 CE
- **Mocenigo's oration** survives only in later chronicles; its figures are not independently verifiable and are not used for balance.
- **Thessalonica 1423**: whether Venice bought the city or accepted it as a protectorate is debated; the Venetian "sale" story is treated as unfounded by recent scholarship.
- **Great galleys** were state-built and auctioned; a private house could not own one. The game turns winning the auction into a technology and a ship class, which is a simplification.
- **Round ship dimensions** follow Lane's ranges; speeds and capacities are gameplay values.
- **Mediterranean winds** use a single 12-month table (rated `reconstruction`); the bora, sirocco and mistral are not modelled.
- **Constantinople** closes on 29 May 1453 and reopens as a restricted Ottoman port on the treaty of 18 April 1454; the two per cent customs duty of the treaty is reflected only as a fee multiplier.
- **Thessalonica after 1430** reopens restricted in 1431 as a simplification of the peace of 1430 and the Venetian withdrawal completed by 1432.

### Carreira da Índia, 1505 CE
- **Bibliography**: Boxer (1969), Pearson (1987), Newitt (2005), the Hakluyt *Commentaries* (1875–1884) and Subrahmanyam's 2012 second edition were confirmed against catalogue and publisher records in October 2026; the 1993 Longman first edition of Subrahmanyam, the University of Minnesota Press imprint of Diffie and Winius, and the 1921 second volume of Dames's *Barbosa* are recorded from the implementer's knowledge and say so on the entry.
- **Dates checked**: Almeida's departure (25 March 1505), the capture of Kilwa (22 July 1505, fort built in seventeen days), Sofala's fort (September to November 1505), the 1507 Mozambique fort, Diu (3 February 1509), Goa (25 November 1510), Hormuz (1515), the withdrawal from Kilwa (1512), Manuel I's death (13 December 1521), Gama's death at Cochin (24 December 1524), the Antwerp factory (moved from Bruges in 1499), the Diu fort (1535) and siege (4 September to 6 November 1538). The 1513 Calicut treaty date, the Zaragoza signing (22 April 1529) and Ridaniya (22 January 1517) follow the standard accounts and were not re-checked.
- **The 1505 investors** were the Welser, Fugger, Höchstetter and Gossembrot of Augsburg and the Imhoff and Hirschvogel of Nuremberg with Genoese and Florentine partners; Marchionni financed the 1501 fleet. The "Florentine house of Lisbon" rival is inspired by him, not a record of his firm.
- **Ships**: the nau's 400 tons follows the Flor de la Mar; the caravel, galleon and Malabar paráu are reconstructions, and the early galleon's form is debated.
- **Cannanore** is grouped under the Cochin polity record for relations; the Kolathiri kingdom was distinct, and the port record says so.
- **Wind**: the Indian Ocean monsoon table is used for the whole map; the Atlantic trade winds are not modelled and the scenario note says so.
- **Enslaved people** were traded at Mina and in the Estado; the game does not represent them as cargo and the scenario note says so.

### Modern scenario
- Port coordinates point at the main container terminal areas and are accurate to roughly a kilometre; they are reference, not navigational, data.
- Throughput rankings and port roles are described qualitatively from UNCTAD's Review of Maritime Transport; no specific statistics are quoted.
- Freight rates, fuel prices, vessel prices and operating costs are gameplay abstractions.

## Map layers
Territorial outlines in `territories.ts` are coarse approximations for orientation, each with a control type, period, evidence rating and sources; none is a surveyed boundary and the map labels every one approximate. The dated changes within campaigns (the Zanj in lower Iraq 869–883; Thessalonica Byzantine to 1423, Venetian 1423–1430, Ottoman from 1430; Cyprus under Mamluk tribute from 1426; Constantinople Ottoman from 1453; the Morea from 1460; Brescia and Bergamo Venetian from 1428; Gujarat independent from 1407) follow the standard accounts cited on each extent. Extents rated `uncertain` (Ziyadid Yemen, Abbasid Oman after 893, the fourteenth-century Swahili towns, Pasai, Calicut, Ternate, Banda, Brunei) mark polities whose territorial reach is thinly documented. Inland settlements are shown for context with their own periods; Great Zimbabwe's occupation dates follow the conventional c. 1100–1450.

## Territory model
Regions are groupings of each scenario's ports made for the influence summary and are rated `reconstruction`. Each campaign's territorial rule records its basis: Gulf merchant communities abroad in the ninth century (Tharisappalli plates, the Accounts of China and India) for Siraf; Swahili towns founded by merchant lineages and Kilwa's hold on Sofala (the Kilwa Chronicle, Sutton, Pearson) for Kilwa; Venetian fondaci and consulates and the Senate's monopoly of overseas possessions (Lane, Ashtor) for Venice; the foreign merchant communities of the Straits (Pires) for Melaka, where a house holding a port in the sultan's name is a reconstruction. Settlements and dependencies, influence scores and their thresholds are gameplay abstractions.

## Wind model
The Siraf, Kilwa and Melaka scenarios use simplified 12-month wind tables (direction and speed) representing the north-east and south-west monsoons with transitional months. They reproduce the seasonal rhythm described by Hourani, Chaudhuri and Reid but are not meteorological reconstructions. The Venice scenario uses a single Mediterranean table (westerlies, winter gales, the summer etesians) rated `reconstruction`.

## Sea lanes
The routing graph (`src/data/sealanes.ts`) is a gameplay abstraction that keeps routes at sea and respects the absence of the Suez (1869) and Panama (1914) canals in earlier periods. It is not a nautical chart.
