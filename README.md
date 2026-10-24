# Ocean Empire 3D

A standalone browser game that combines a 3D ship simulator, a maritime empire builder, historical trade campaigns, fleet management and a source-backed historical encyclopedia. Built with Next.js (App Router), TypeScript, React Three Fiber, Tailwind CSS and Zustand. It runs entirely in the browser with no paid APIs; Supabase persistence is optional.

The full design brief is in `docs/MASTER_PROMPT.md`. This repository implements the **first playable release** described in its Part 16: three complete scenarios, a working 3D ocean with controllable vessels, a global port map, contracts and economy, ship purchasing, port development, technology, diplomacy, missions, save/restore, and the encyclopedia.

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

It creates (or reuses) a project named `ocean-empire-3d`, applies the migration, enables anonymous sign-ins and prints the two public variables. If `VERCEL_TOKEN`, `VERCEL_PROJECT` and `VERCEL_TEAM_SLUG` are also set it writes them to the Vercel project and redeploys production. The script has not yet been exercised against a live Supabase account; see its header for the API calls it makes.

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

### Deploying to Vercel

Import the repository in Vercel. The defaults (framework: Next.js, build `next build`) work as-is. Add the two Supabase variables in the project settings only if you want remote saves. The project does not depend on any other deployment, API, domain or repository.

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

Quality presets (low / medium / high) control device pixel ratio, shadows and ocean tessellation. The 3D scene reads game state through a per-frame shared record rather than React re-renders; the HUD updates at about 8 Hz. The simulation integrates ship movement in substeps of at most 120 simulated seconds so high time acceleration does not skip waypoints. Frame rates depend on hardware and have not been benchmarked; no specific figure is claimed.

## Verification

`npm run check` (typecheck, lint, 44 unit/integration tests, production build) passes. The production build was also driven end to end in headless Chromium with Playwright: new game → accept the Port Klang→Singapore contract → depart → autopilot voyage at accelerated time → automatic docking, payment and voyage report → save restored after reload, plus the Siraf and Melaka sailing scenes, diplomacy, history and encyclopedia pages.

## Status and limitations

This is the first vertical slice. Not yet implemented from the master brief: AI-controlled trading powers with their own fleets, additional civilizations beyond the two campaigns, population/prosperity simulation, and the optional AI history assistant. Supabase sync is implemented but has only been exercised against the schema, not a live project.
