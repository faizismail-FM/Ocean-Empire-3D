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

### Modern scenario
- Port coordinates point at the main container terminal areas and are accurate to roughly a kilometre; they are reference, not navigational, data.
- Throughput rankings and port roles are described qualitatively from UNCTAD's Review of Maritime Transport; no specific statistics are quoted.
- Freight rates, fuel prices, vessel prices and operating costs are gameplay abstractions.

## Monsoon model
Both historical scenarios use a simplified 12-month wind table (direction and speed) representing the north-east and south-west monsoons with transitional months. It reproduces the seasonal rhythm described by Hourani, Chaudhuri and Reid but is not a meteorological reconstruction.

## Sea lanes
The routing graph (`src/data/sealanes.ts`) is a gameplay abstraction that keeps routes at sea and respects the absence of the Suez (1869) and Panama (1914) canals in earlier periods. It is not a nautical chart.
