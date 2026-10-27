# Ocean Empire 3D

A standalone browser game that combines a 3D ship simulator, a maritime empire builder, historical trade campaigns, fleet management and a source-backed historical encyclopedia. Built with Next.js (App Router), TypeScript, React Three Fiber, Tailwind CSS and Zustand. It runs entirely in the browser with no paid APIs; Supabase persistence is optional.

The full design brief is in `docs/MASTER_PROMPT.md`. This repository implements the **first playable release** described in its Part 16: three complete scenarios, a working 3D ocean with controllable vessels, a global port map, contracts and economy, ship purchasing, port development, technology, diplomacy, missions, save/restore, and the encyclopedia. A player guide (`/guide`, also opened with `?` in the sailing view and from the `?` buttons on each screen) explains the core loop, controls, time scale, trade, fleet and ports.

## Scenarios

| Scenario | Period | You play | Highlights |
| --- | --- | --- | --- |
| **Merchants of Siraf** | 850–900 CE, Abbasid Gulf | A fictional merchant house at Siraf | 11 period ports (Siraf, Basra, Suhar, Aden, Kollam, Mantai, Kalah, Khanfu…), sewn-plank ships, monsoon winds and provisions, the Zanj revolt and the 879 sack of Guangzhou as dated events |
| **Emporium of the Straits** | 1460–1511 CE, Melaka Sultanate | A fictional trading house at Melaka | 15 ports from Cambay to Banda, jong and hybrid junks, Ming tribute access, campaign ends at the Portuguese capture of 1511 |
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

### Accounts and cross-device saves

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
2. **Destination**: choose the destination on the World map, the HUD or the contract card. Routes follow a sea-lane graph (`src/data/sealanes.ts`) so ships round peninsulas instead of crossing land; canal nodes are disabled before their opening years.
3. **Sail**: depart; the autopilot steers through the waypoints, slowing for the berth. Take the helm at any time. Sailing ships depend on the monsoon regime of their scenario and tack when headed.
4. **Arrive**: within 0.6 nm of the port the ship docks automatically, port fees are charged, contract cargo for that port is delivered and paid exactly once (late deliveries are penalised, early ones get a small bonus), and a voyage report is shown.
5. **Grow**: refuel or provision, repair, invest in docks, warehouses, shipyards and more, acquire technologies, negotiate access, buy or build ships.

Daily upkeep is charged per ship; a home-port customs house produces income. Prices drift deterministically per week from a seed, so a save always sees the same markets.

## Project layout

```
src/data          Immutable reference database (Zod-validated): ports, ships, goods, technologies,
                  events, figures, routes, civilizations, sources, scenarios, sea lanes, infrastructure
src/engine        Pure simulation rules: geo, kinematics, wind, autopilot, routing, economy, markets,
                  contracts, port development, technology, objectives, events, game tick, save validation
src/store         Zustand stores wrapping the engine (game, settings)
src/persistence   Storage adapters: localStorage (default) + optional Supabase mirror
src/components    UI primitives, game screens, the d3-geo world map, the R3F sailing scene and HUD
src/app           Next.js routes: menu, new game, /play/* screens, /encyclopedia/*
supabase          Optional database schema with RLS
tests             Vitest suites (44 tests)
docs              Master design prompt and research notes
```

Design rules kept throughout:

- Historical data is separate from mutable player state and is never modified by play. The alternate-history sandbox announces events without applying them and labels results as fiction.
- Gameplay numbers (prices, speeds, costs) are labelled as abstractions; the interface marks simulated values and distinguishes them from reference data.
- No external 3D model URLs: all ships, ports and effects are procedural. The world map uses the bundled Natural Earth topology, not a tile server.
- Three.js only runs in the browser (dynamic import, `ssr: false`), with a WebGL fallback.

## Performance notes

Quality presets (low / medium / high) control device pixel ratio, shadows and ocean tessellation (10 m, 5 m or 3.5 m cells on the 1.4 km displaced sheet around the ship; a flat sheet carries the water to the fog). The ocean is a sum of eight swell components that displace the mesh plus three ripple components that only perturb per-pixel normals. Every component keeps its own phase: each frame the phases advance by real time and by the difference between the ship's real-speed movement and its scene movement, so the water passes the hull at the ship's actual speed at any time scale and the wake, bobbing and glitter never degrade into noise at 60× or 3600×. The wake is stored relative to the ship and recedes at real speed for the same reason. The 3D scene reads game state through a per-frame shared record rather than React re-renders; the HUD updates at about 8 Hz. The simulation integrates ship movement in substeps of at most 120 simulated seconds so high time acceleration does not skip waypoints. Frame rates depend on hardware and have not been benchmarked; no specific figure is claimed.

## Verification

`npm run check` (typecheck, lint, 44 unit/integration tests, production build) passes. The production build was also driven end to end in headless Chromium with Playwright: new game → accept the Port Klang→Singapore contract → depart → autopilot voyage at accelerated time → automatic docking, payment and voyage report → save restored after reload, plus the Siraf and Melaka sailing scenes, diplomacy, history and encyclopedia pages.

## Status and limitations

This is the first vertical slice. Not yet implemented from the master brief: additional civilizations beyond the two campaigns. AI trading powers, the population and prosperity indicators and the optional AI history assistant are in place. Supabase sync and email sign-in run against a live project in production. Sign-in emails use Supabase's built-in mailer, which is limited to a few per hour until custom SMTP is configured (see "Accounts and cross-device saves"). The bibliography has been checked against catalogues and reviews, and the remaining open questions in `docs/RESEARCH_NOTES.md` (Kalah's site, Daybul's identification, Aden in 850) are open in the scholarship itself, and rendering has only been checked on a software renderer and one laptop GPU, with no frame-rate benchmarks.
