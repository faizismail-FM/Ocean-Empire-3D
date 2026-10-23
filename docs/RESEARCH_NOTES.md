# Research notes and verification status

The historical database in `src/data/historical` was compiled from the implementer's knowledge of the published literature, without live library or web access during implementation. In line with the design brief (Part 7.3), nothing here is presented as verified merely because it exists in the database. This file records what is well supported, what is interpretive, and what still needs checking before the encyclopedia can be described as authoritative.

## Evidence ratings used

| Rating | Meaning |
| --- | --- |
| `established` | Widely accepted on documentary or archaeological evidence |
| `scholarly_interpretation` | Supported by evidence but dependent on historians' interpretation |
| `reconstruction` | A reasonable reconstruction made to make the game playable |
| `uncertain` | Disputed, incomplete or unverified |
| `fictional` | Gameplay invention, not a historical claim |

## Bibliography: items to verify

No citation was invented. The following entries were recorded from memory and should have edition, pagination or URL checked (they carry a `notes` field saying so in `sources.ts`):

- Whitehouse, *Excavations at Sīrāf: First Interim Report*, Iran 6 (1968) and the later interim reports in Iran 7–12.
- Carswell, Deraniyagala & Graham (eds.), *Mantai: City by the Sea* (2013).
- Malekandathil, *Maritime India* (2010).
- Narayanan, *Perumals of Kerala* (revised edition 2013; original 1996).
- Thomaz, "The Malay Sultanate of Melaka", in Reid (ed.), *Southeast Asia in the Early Modern Era* (1993) — page range to confirm.
- Winstedt & de Josselin de Jong, "The Maritime Laws of Malacca", JMBRAS 29(3) (1956).

## Claims that need further research

### Siraf, 850 CE
- **Kalah's location** is unresolved (Kedah/Bujang valley is one candidate among several). The port is drawn at an approximate position and flagged `disputed`.
- **Aden in the ninth century**: Aden's role is far better documented for the 11th–13th centuries (Margariti). The ninth-century record is rated `uncertain`, and the Ziyadid dynasty's effective control of Aden is likewise uncertain.
- **Basra's medieval site**: the early city lay near modern al-Zubayr; coordinates are approximate.
- **Daybul = Banbhore** is the usual identification but not certain; coordinates are flagged approximate.
- **Manda**: the settlement's name in contemporary Arabic sources is unknown; "Manda" is the modern island name.
- **Star-altitude navigation** in the ninth century is inferred from later practice (the kamal and Ibn Mājid's manuals are 15th century); rated `uncertain`.
- **Ship classes**: only the Belitung wreck is excavated. The "large sewn-plank ship" and "coastal vessel" are reconstructions; the word "dhow" is avoided as anachronistic for the period (Agius 2008).
- **Ambergris and pearls** are mentioned by Abu Zayd; the quantities, prices and cargo-space values in the game are abstractions.
- **Siraf earthquake c. 977** is reported by later medieval writers; date and damage uncertain. It lies outside the campaign window.
- Casualty figures given by Abu Zayd for the 879 Guangzhou massacre are not independently verifiable and are not quoted as fact.

### Melaka, 1460 CE
- **Founding date** (c. 1400) is conventional; the first firm records are Ming entries of 1403–1405.
- **Regnal dates** of Mansur Shah (c. 1459–1477) and Tun Perak's ministry (c. 1456–1498) derive from the Sejarah Melayu and later scholarship; treated as `scholarly_interpretation`.
- **Parameswara / Iskandar Shah** identity question is noted in the figure entry.
- **Undang-Undang Laut Melaka** is traditionally placed in Mahmud Shah's reign; the game offers it as an acquirable capability rather than a dated event.
- **Ternate and Brunei** polities before 1500 are thinly documented; both are rated `uncertain`.
- **Ayutthaya and Pegu** lay inland; their map positions are the cities, reached by river.
- **Currency**: Melaka used tin coinage alongside gold, silver and Chinese cash; the game's "trade cash" is an abstract unit, not a historical price level.
- **Jong dimensions and capacities** follow Manguin's conservative estimates; Portuguese reports of much larger vessels are noted but not used for balance.

### Modern scenario
- Port coordinates point at the main container terminal areas and are accurate to roughly a kilometre; they are reference, not navigational, data.
- Throughput rankings and port roles are described qualitatively from UNCTAD's Review of Maritime Transport; no specific statistics are quoted.
- Freight rates, fuel prices, vessel prices and operating costs are gameplay abstractions.

## Monsoon model
Both historical scenarios use a simplified 12-month wind table (direction and speed) representing the north-east and south-west monsoons with transitional months. It reproduces the seasonal rhythm described by Hourani, Chaudhuri and Reid but is not a meteorological reconstruction.

## Sea lanes
The routing graph (`src/data/sealanes.ts`) is a gameplay abstraction that keeps routes at sea and respects the absence of the Suez (1869) and Panama (1914) canals in earlier periods. It is not a nautical chart.
