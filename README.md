# Ocean Empire 3D

A standalone browser game that combines a 3D ship simulator, a maritime empire builder, historical trade campaigns, fleet management and a source-backed historical encyclopedia. Built with Next.js (App Router), TypeScript, React Three Fiber, Tailwind CSS and Zustand. It runs entirely in the browser with no paid APIs; Supabase persistence is optional.

The full design brief is in `docs/MASTER_PROMPT.md`. This repository implements the **first playable release** described in its Part 16: six complete scenarios, a working 3D ocean with controllable vessels, a global port map, contracts and economy, ship purchasing, port development, technology, diplomacy, missions, save/restore, and the encyclopedia. A player guide (`/guide`, also opened with `?` in the sailing view and from the `?` buttons on each screen) explains the core loop, controls, time scale, trade, fleet and ports.

## Scenarios

| Scenario | Period | You play | Highlights |
| --- | --- | --- | --- |
| **The Alexandrian Fleet** | 112–161 CE, Roman Empire | A fictional house of shipowners (navicularii) at Alexandria | 18 ports from Gades, Massilia, Carthage, Puteoli and Portus to Cyrene, Caesarea, Tyre, Ephesus and Rhodes, and through Trajan's canal to Aila, Myos Hormos, Berenike, Adulis, Muza, Muziris and Barygaza; a new Roman merchantman hull (swan-neck stern, steering oars, artemon), the corbita, the Alexandrian grain ship and the Red Sea merchantman; wheat, papyrus, glass, wine, garum, purple, coral and coin for pepper, myrrh and cottons; Trajan's harbour and canal, the Parthian war, the Diaspora revolt, Hadrian in Egypt, Bar Kokhba, the Farasan garrison, the Muziris papyrus and Ptolemy's Geography to the death of Antoninus Pius as dated events |
| **Merchants of Siraf** | 850–900 CE, Abbasid Gulf | A fictional merchant house at Siraf | 11 period ports (Siraf, Basra, Suhar, Aden, Kollam, Mantai, Kalah, Khanfu…), sewn-plank ships, monsoon winds and provisions, the Zanj revolt and the 879 sack of Guangzhou as dated events |
| **Harbour of the Maharaja** | 992–1037 CE, Srivijaya | A fictional merchant house at Palembang | 14 ports from Palembang, Jambi, Kadaram (Kedah), Takuapa, Ligor, Lamuri and Barus to the Brantas delta, Puni, Champa, the Song trade office at Guangzhou, Quanzhou, Nagapattinam and Kollam, lashed-lug ships and the kunlun ocean trader, Barus camphor and Sumatran gold for Song stoneware and Chola cottons, the Javanese war of 992, the Cudamani kings' embassies, the vihara at Nagapattinam (c. 1006), Atiśa's stay, the Javanese disaster of 1016, Rajendra Chola's raid of 1025 and Airlangga's dam of 1037 as dated events |
| **The Office of Maritime Trade** | 1087–1127 CE, Northern Song | A fictional Quanzhou shipping house under the new trade office | 16 ports from Quanzhou, Fuzhou, Mingzhou, Hangzhou and Guangzhou to Banqiao and the Yesong river port of Goryeo, Hakata, Champa, Srivijaya at Jambi and Palembang, Kediri's Brantas port, Puni, Ma-i, Butuan and Nagapattinam, the Fujian seagoing junk of the Quanzhou wreck, Song stoneware, books, ginseng and Japanese gold, the Quanzhou office, the Banqiao office, the Smaller Leiden plates, Su Shi's memorials, Zhu Yu's compass, the Fang La rising, Xu Jing's embassy and Mazu's first title, and the Jurchen invasion to the fall of Kaifeng as dated events |
| **Sultans of Kilwa** | 1330–1380 CE, Swahili coast | A fictional merchant house at Kilwa | 9 ports from Sofala to Hormuz and Cambay, sewn ships and the mtepe, Sofala gold for Indian cloth, Ibn Battuta's visit, the Gujarat revolts and the Black Death at Aden as dated events |
| **Fleets of the Western Ocean** | 1405–1435 CE, early Ming China | A fictional Fujian shipping house in the wake of the treasure fleets | 19 ports from the Yangtze mouth, Ryukyu and Hakata across the South China Sea to Champa, Siam, Palembang, Melaka, Ceylon, Bengal, Calicut, Hormuz, Aden and the Swahili coast, sand ships, Fujian junks and the treasure ship (drawn at Church's 62 m, not the Ming History's 137 m), the sea ban and the tribute tallies, Chen Zuyi 1407, Galle 1409, Parameswara at Nanjing 1411, Hormuz 1414, the halt of 1424 and the last fleet 1431–1433 as dated events |
| **Galleys of Venice** | 1423–1463 CE, Republic of Venice | A fictional patrician house at Venice | 12 ports from Sluys to Alexandria, round ships and state-auctioned great galleys, Mediterranean winds, Thessalonica, Barsbay's pepper monopoly and the fall of Constantinople; campaign ends at the Ottoman war of 1463 |
| **Emporium of the Straits** | 1460–1511 CE, Melaka Sultanate | A fictional trading house at Melaka | 15 ports from Cambay to Banda, jong and hybrid junks, Ming tribute access, campaign ends at the Portuguese capture of 1511 |
| **Carreira da Índia** | 1505–1550 CE, Portuguese Cape route | A fictional Lisbon merchant house under the Crown's licence | 14 ports from Antwerp and Mina round the Cape to Cochin, Goa, Hormuz and Malacca, caravels, naus and galleons, the Crown's pepper monopoly, Diu 1509, Goa 1510, Malacca 1511, Hormuz 1515 and the Ottoman siege of Diu 1538 as dated events |
| **The Company's Monopoly** | 1602–1652 CE, Dutch East India Company | A fictional Amsterdam merchant house under the Company's charter | 16 ports from Amsterdam round the Cape on Brouwer's route to Bantam, Batavia, Amboina, Banda, Hirado, Coromandel, Surat, Mocha, Gamron and Formosa, jachts, fluyts and retourschepen, Japanese silver and Coromandel cloth, Amboina 1605, Batavia 1619, Banda 1621, Malacca 1641, Dejima 1641 and the Cape 1652 as dated events |
| **The Honourable Company** | 1757–1793 CE, East India Company | A fictional London house of ships' husbands under the Company's charter | 17 ports from the Thames by Madeira, St Helena and the Dutch Cape to Mocha, Bombay, Tellicherry, Madras, Pondicherry, Tranquebar, Calcutta, Bencoolen, Penang, Batavia, Manila, Macao and the Whampoa anchorage at Canton, a new ship-rigged hull for Indiamen, country ships and snows, tea, nankeens, saltpetre and Bombay cotton, Plassey, the Canton edict, Flint's petition, Manila 1762, the diwani, the famine, the credit crisis, the wars with France and Mysore, the Commutation Act, the Lady Hughes affair, Penang 1786 and Macartney at Jehol as dated events |
| **Modern Shipping Empire** | 2024, open-ended | A fictional container line at Port Klang | 20 real container ports, feeder to ULCV classes, fuel, terminal fees, the Port Klang → Singapore tutorial |

Every historical record carries an evidence rating (established / interpretation / reconstruction / uncertain / fictional) and its sources. See `docs/RESEARCH_NOTES.md` for what still needs verification.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # eslint
npm run test       # vitest: geography, kinematics, autopilot, economy, contracts, data integrity, tutorial run
npm run build      # production build
npm run check      # all of the above
```

No environment variables are needed to play. Saves are kept in the browser (`localStorage`) and can be exported as JSON from Settings.

### Optional Supabase sync

Automated: with a Supabase personal access token exported as `SUPABASE_ACCESS_TOKEN`, run

```bash
node scripts/setup-supabase.mjs
```

It creates (or reuses) a project named `ocean-empire-3d`, applies the migration, enables anonymous sign-ins and prints the two public variables. If `VERCEL_TOKEN`, `VERCEL_PROJECT` and `VERCEL_TEAM_SLUG` are also set it writes them to the Vercel project and redeploys production. The script has been run against a live Supabase account to provision the production project; see its header for the API calls it makes.

Manual:

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor.
2. Enable **Anonymous sign-ins** under Authentication → Providers.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for Vercel, add the same two variables in the project settings and redeploy).

Only the public anon key is used client-side; rows are protected by row-level security. Never put a service-role key in a `NEXT_PUBLIC_` variable.

### Historical map layers

The world map and the encyclopedia's Historical maps page draw dated layers (`src/data/historical/territories.ts`, helpers in `src/lib/map-layers.ts`): territorial control as coarse, approximate outlines with a control type (direct rule, suzerainty, sphere, rebel-held), a period, an evidence rating and sources, read at the current game year so Zanj Iraq, Thessalonica, Constantinople, Cyprus and the Morea change during their campaigns; inland capitals and settlements for that year; port ownership by polity; documented routes; the player's own trade network and influence; and present-day borders, which historical campaigns draw only on request and mark as reference only. Hovering an outline shows its period and source ids; the maps page has a year slider, jump buttons for the years in which control changes, and a panel listing every extent with its sources. Polities without a dated extent fall back to their undated approximate region.

### Territory

Sovereign territory is never for sale. Historical scenarios define regions (groupings of their ports, rated as reconstructions) and a territorial rule with its historical basis (`regions` and `territory_rules` in the scenario data; engine in `src/engine/territory.ts`). Every port carries the house's commercial influence (0 to 100), which relaxes daily toward a target set by the house's share of the port's traffic, its facilities, its holdings and rival development, and is always 100 at home. Where the rules allow, the house can found a trading settlement at a port it has called at (influence 25, relations 50 with the ruler): building and ship purchase rights, an extra weekly contract, agreement-level fees and a daily upkeep. Kilwa and Melaka also allow a settled port with influence 70, the larger part of its traffic and the ruler's favour to be brought under the house's protection: lower fees, two extra contracts and customs duties at half the home rate, at the cost of relations with its ruler; great cities are never available. The Empire screen summarises influence by region, the world map draws influence rings and holding markers, and the port panel offers the actions with the reason when one is unavailable. Holdings are gameplay inventions and the encyclopedia keeps the documented rulers.

### Alternate-history sandbox

A historical house can be created under sandbox rules (`empire.rules === "sandbox"`). The documented timeline is unchanged, but at each turning point (a dated event with a gameplay effect) the simulation pauses and the player chooses what the game does: the documented consequence, nothing (averted), a softened version (closures become restrictions, multipliers move half as far) or the reverse. Decisions can be set in advance from the History screen. Rivals react to what actually happened in the game. Every departure from the record is logged in `state.alternate_history.divergences`, shown with a fiction label on the History screen, in the empire dashboard and in the top bar, and never touches the reference database (`src/engine/alternate.ts`). A sandbox campaign continues past its historical end unless the player lets the ending event happen.

## Accounts and cross-device saves

With Supabase configured, every browser first gets an anonymous Supabase identity so its saves can be mirrored. To keep saves across devices, players sign in with their email from the main menu or Settings → Account: the game emails a sign-in link (no password), and opening that link on a device signs it in. An anonymous identity is upgraded in place when possible, so existing saves keep their ids; otherwise the device's local saves are uploaded to the account on sign-in (re-identified if their ids already belong to an old anonymous identity). The Continue list merges local and account saves and loads whichever copy is newer.

Operational notes:
- Supabase's built-in email service is limited to a couple of emails per hour per project and is meant for development. For real players configure a custom SMTP provider under Authentication → SMTP Settings; that also unlocks custom email templates (for example a code the player can type instead of a link).
- The project's Site URL and redirect allow-list must include the deployed origin (`https://ocean-empire-3d.vercel.app/**`) for the links to land on the game; `scripts/setup-supabase.mjs` does not set these, see Authentication → URL Configuration.
- Sign-in links use the implicit flow so a link opened from a mail app's browser still works on that device.

### Optional AI history assistant

Encyclopedia entry pages can carry an "Ask about this entry" box. It is served by `src/app/api/history-assistant/route.ts`, which grounds Claude (`claude-opus-5-5`) in the entry's own record, closely related records and the bibliography behind them (`src/lib/history-grounding.ts`) and instructs it to answer only from that material, to say when the record does not cover a question, to label interpretation, reconstruction and fiction, and to cite the bracketed source ids. Gameplay tuning values are stripped from the material so they are never presented as history. The player's question and the entry material are sent to Anthropic's API; nothing else about the player is.

Set `ANTHROPIC_API_KEY` in the server environment (for Vercel: Project → Settings → Environment Variables, then redeploy) to enable it. Without the key the route answers that the assistant is not enabled and the page says so; the game and the encyclopedia need no API key, as the brief requires.

### Deploying to Vercel

Import the repository in Vercel. The defaults (framework: Next.js, build `next build`) work as-is. Add the two Supabase variables in the project settings only if you want remote saves. The project does not depend on any other deployment, API, domain or repository.

## Population and prosperity

Each port carries three indicators (`src/engine/demographics.ts`): population in abstract thousands seeded from the port's size and period, prosperity (0–100) pulled daily toward a target set by recent ship calls, market turnover, facilities, fees and access, and public order, which recovers slowly and collapses when an event closes the port. They feed back into play: prosperity and population scale the market's weekly stock and the number and value of contracts, disorder raises port charges, facilities above level 2 need a prosperous workforce, and the home port's figures shape the empire's stability and daily duties. Older saves seed the indicators from the port record on first load.

## Rival trading powers

Each scenario defines three AI trading powers (`rivals` in the scenario data; engine in `src/engine/rivals.ts`). They run fleets on the same sea lanes and the same contract board as the player: a docked rival ship takes one of the contracts on offer at its port or sails on its own account, arrival pays it and records a port call, and with money in hand it buys ships and builds cargo handling at its busiest port. Traffic share per port is derived from those calls; a rival above half the traffic raises the player's terminal charges there by 10%. Relations with the player drift toward neutral, fall when the player accepts contracts at the rival's home port, and can be raised with courtesies or a partnership. Own-account voyages buy and sell real goods: a rival ship with no contract buys the good with the best live margin within reach and sells it on arrival through the shared market ledger (`state.market`, per port, good and week), so rival purchases draw down the stock the player sees and rival sales weigh on the price (`pricePressure` in `src/engine/market.ts`, bounded to 0.6 to 1.5). Rivals also trade with each other: each posts charters at its home port that any carrier (the player included) may take, with the charterer paying on delivery; calling at another rival's home port pays that rival a handling fee; mutual standing built this way forms alliances at 70 (no bidding at each other's home ports, preference for each other's charters) that break below 40. Rivals react to historical events through the events' own effects: ships bound for a port an event closes or makes expensive divert to the nearest open port, a rival based there loses money, price booms draw rivals to the goods' suppliers, and a relations change for a rival's polity moves its standing with the player. Rivals appear on the world map, in the sailing view when nearby, and on the Rivals screen, which also lists each rival's responses to events. All rivals are fictional, and the engine is deterministic from the save's seed. Saves from before this feature load with no rivals.

## Landing page

The main menu sits over a live sea rather than a picture: the same procedural ocean, sky, hull builders and wake as the sailing view (`src/components/three/MenuScene.tsx`), with the vessel of the chosen era sailing off its home port under a gentle autopilot while the sun climbs and sets over a few minutes. The era chips swap the ship (each scenario's starting vessel, in its polity's colour, with that scenario's wind) and the music palette, and "Begin this campaign" opens the new-game wizard with that scenario preselected (`/new?scenario=<id>`). Visitors can drag the sea to look around and scroll to zoom, and take the helm with A/D and W/S or the strip's buttons; the readout shows speed, heading, wind and the time of day, and the autopilot takes the wheel back twenty seconds after the last input. The demo ship uses the real kinematics and wind model (`src/engine/ship.ts`) but touches no save. It runs at a fixed low quality (no shadows, 7 m ocean cells, device pixel ratio capped at 1.5), stops animating when the tab is hidden, drifts the camera only when the visitor has not asked for reduced motion, and falls back to the static horizon when WebGL is unavailable.

## Sound

All sound is synthesised in the browser with the Web Audio API; no audio files are shipped or downloaded. In the sailing view a looping noise source is shaped into sea (low-passed, with a slow swell) and wind (band-passed, its level and pitch following the simulated wind), sailing ships creak under way and motor ships hum with the throttle. A generative music bed plays a drone and a sparse random-walk melody in a palette chosen for the campaign (`src/lib/audio/music.ts`: a Phrygian lyre-like pluck for Roman Alexandria, a hijaz-flavoured plucked tone for Siraf, a pelog-like metallic tone for Srivijaya, a pentatonic zither for the Ming fleets, a major-mode hornpipe pluck for the East India Company, a bowed Dorian line for Venice, a slendro-like metallic tuning for Melaka, harpsichord for the Dutch Company, synthesiser pads for the modern line). The palettes set a mood and do not claim to reproduce period music. Music also plays quietly on the main menu and management screens; the encyclopedia is silent. Browsers only allow sound after a user gesture, so it starts on the first click or key; the speaker button in the sailing bar and on the main menu mutes it, and Settings has separate levels for master, music and ambience.

## Controls (sailing view)

| Key | Action |
| --- | --- |
| W / S | Increase / decrease throttle or sail |
| A / D | Steer to port / starboard (hold) |
| Space | Pause / resume |
| C | Cycle camera (chase, free, overhead) |
| + / − | Zoom, R to reset |
| Esc | Game menu |

All controls are also available as on-screen buttons. Keys are ignored while typing in a form field. Any manual input disengages the autopilot.

## How a voyage works

1. **Trade**: accept a contract at a port where one of your ships is docked (capacity, origin and route are validated), or buy market cargo.
2. **Destination**: choose the destination on the World map, the HUD or the contract card. Routes follow a sea-lane graph (`src/data/sealanes.ts`) so ships round peninsulas instead of crossing land; canal nodes are disabled before their opening years and, for Trajan's canal from the Nile to the Red Sea, after the year it silted.
3. **Sail**: depart; the ship leaves its berth pointing down the port's fairway and the autopilot steers through the waypoints, slowing for the berth. Take the helm at any time. Sailing ships depend on the monsoon regime of their scenario and tack when headed.
4. **Arrive**: the route comes in through the destination's fairway, straight in from the sea side; within 0.25 nm of the berth the ship docks automatically and comes alongside the quay, port fees are charged, contract cargo for that port is delivered and paid exactly once (late deliveries are penalised, early ones get a small bonus), and a voyage report is shown.
5. **Grow**: refuel or provision, repair, invest in docks, warehouses, shipyards and more, acquire technologies, negotiate access, buy or build ships.

Daily upkeep is charged per ship; a home-port customs house produces income. Prices drift deterministically per week from a seed, so a save always sees the same markets.

### Harbours

Every port has a quay and a landmass behind it, and they are solid. Their placement is a pure function of the port record (`src/engine/harbour.ts`): the sea lies toward the port's lane nodes (their mean bearing, or an explicit `sea_bearing` on the record), the quay runs across that direction and the land sits behind it, and the same shapes are drawn by the sailing scene and used by the simulation. Routes leave and enter every port through a fairway waypoint 3 nm out on the sea side, so the first and last legs are always in open water; a docked ship lies alongside the quay and a departing ship points down the fairway. A ship steered into the quay or the shore runs aground: it is held at the water's edge with its speed at zero, loses two points of condition, the crew swings the bow toward open water, and it gets off again under its own power or by re-engaging the autopilot (which plans from the ship's position through the fairway). Docked rival ships take berths along the quay and ambient traffic bears away from the shore. `tests/data.test.ts` checks that every planned route in every campaign clears every harbour's land, and `tests/harbour.test.ts` covers the geometry.

## Project layout

```
src/data          Immutable reference database (Zod-validated): ports, ships, goods, technologies,
                  events, figures, routes, civilizations, sources, scenarios, sea lanes, infrastructure
src/engine        Pure simulation rules: geo, kinematics, wind, autopilot, routing, harbours, economy, markets,
                  contracts, port development, technology, objectives, events, game tick, save validation
src/store         Zustand stores wrapping the engine (game, settings)
src/persistence   Storage adapters: localStorage (default) + optional Supabase mirror
src/components    UI primitives, game screens, the d3-geo world map, the R3F sailing scene and HUD
src/app           Next.js routes: menu, new game, /play/* screens, /encyclopedia/*
supabase          Optional database schema with RLS
tests             Vitest suites (116 tests)
docs              Master design prompt and research notes
```

Design rules kept throughout:

- Historical data is separate from mutable player state and is never modified by play. The alternate-history sandbox changes only the simulated consequences of events, at the player's decision, and labels every departure from the record as fiction.
- Gameplay numbers (prices, speeds, costs) are labelled as abstractions; the interface marks simulated values and distinguishes them from reference data.
- No external 3D model URLs: all ships, ports and effects are procedural (twelve hull patterns from the Roman merchantman and the sewn-plank ship to the eighteenth-century ship-rigged Indiaman and the container ship). The world map uses the bundled Natural Earth topology, not a tile server.
- Three.js only runs in the browser (dynamic import, `ssr: false`), with a WebGL fallback.

## Performance notes

Quality presets (low / medium / high) control device pixel ratio, shadows and ocean tessellation (10 m, 5 m or 3.5 m cells on the 1.4 km displaced sheet around the ship; a flat sheet carries the water to the fog). The default setting is **auto**: it starts at medium, drops a level as soon as the average frame takes more than 33 ms (under 30 frames per second), rises a level after three consecutive two-second windows under 12.5 ms (over 80), waits three seconds after each change while shaders compile, and says so in a toast when it lowers the level. "Show frame rate in the sailing view" (Settings) puts frames per second, average and 95th-percentile frame time, draw calls and the level in use under the time-scale buttons; the Settings page shows the last measurement. The sampler is `src/lib/perf.ts`, and `window.__oceanEmpirePerf()` returns the same numbers for tooling.

The ocean is a sum of eight swell components that displace the mesh plus three ripple components that only perturb per-pixel normals. The flat far sheet shades with the four long swells only; the near sheet fades the short swells and the ripples out toward its edge so the two meet without a seam. Every component keeps its own phase: each frame the phases advance by real time and by the difference between the ship's real-speed movement and its scene movement, so the water passes the hull at the ship's actual speed at any time scale and the wake, bobbing and glitter never degrade into noise at 60× or 3600×. The wake is stored relative to the ship and recedes at real speed for the same reason. Shadow maps are 1024 texels on medium and 2048 on high over an 800 m frustum (0.8 m and 0.4 m per texel). The 3D scene reads game state through a per-frame shared record rather than React re-renders; the HUD updates at about 8 Hz. The simulation integrates ship movement in substeps of at most 120 simulated seconds so high time acceleration does not skip waypoints.

**Frame-rate pass (November 2026).** Measured on the production build in headless Chromium at 1280×720 with the SwiftShader software renderer, the only GPU available to the build environment, so the absolute numbers say nothing about real hardware; the shares do:

- A 10-second main-thread profile of the sailing scene under way at 60× was 98% idle. The simulation tick, the rival fleets, React and the HUD cost nothing measurable; frame time is GPU fill.
- Software-rendered frame times averaged about 160 ms docked and 210 ms at sea on low, 155 and 300 ms on medium, 255 and 395 ms on high; docked is cheaper because the quay and land cover water pixels, which is why the ocean shader was the target. Shading the far sheet with four components instead of eleven took about a tenth off the low preset's frame; a gradient sky in place of the scattering shader changed nothing measurable and was not kept. Medium and high cost more than low mostly in vertex and shadow work, which real GPUs handle far more cheaply than a software renderer.
- Not measured: any real GPU, phones, or the landing-page scene. The in-game readout exists so that those measurements can be taken where the game is played; no frame rate is claimed.

## Verification

`npm run check` (typecheck, lint, 116 unit/integration tests, production build) passes. The production build was also driven end to end in headless Chromium with Playwright: new game → accept the Port Klang→Singapore contract → depart down the fairway → autopilot voyage at accelerated time → approach through the Singapore fairway, automatic docking alongside the quay, payment and voyage report → a manual run into the shore that grounds and refloats → save restored after reload, plus the Roman, Siraf, Srivijaya, Song, Kilwa, Ming, Venice, Melaka, Carreira, Dutch Company and East India Company sailing scenes, diplomacy, history and encyclopedia pages.

## Status and limitations

This is the first vertical slice. Eleven historical campaigns cover every civilization family the brief lists (the ancient Mediterranean under Rome, Abbasid-era Gulf trade, Srivijaya and Southeast Asian maritime trade, the Swahili city-states, Chinese maritime commerce under the Northern Song and the early Ming, Venetian commerce, the Melaka Sultanate, Portuguese expansion, Dutch commerce and British commercial expansion under the East India Company); the Cholas appear as a polity inside the Srivijaya and Song campaigns rather than as a campaign of their own. AI trading powers, the population and prosperity indicators and the optional AI history assistant are in place. Supabase sync and email sign-in run against a live project in production. Sign-in emails use Supabase's built-in mailer, which is limited to a few per hour until custom SMTP is configured (see "Accounts and cross-device saves"). The bibliography has been checked against catalogues and reviews, and the remaining open questions in `docs/RESEARCH_NOTES.md` (Kalah's site, Daybul's identification, Aden in 850, the date of the Javanese disaster of 1006 or 1016, the Kilwa regnal dates, the fourteenth-century harbour of Zanzibar) are open in the scholarship itself, and rendering has only been checked on a software renderer and one laptop GPU, with no frame-rate benchmarks.
