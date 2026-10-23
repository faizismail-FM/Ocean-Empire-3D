# OCEAN EMPIRE 3D — COMPLETE MASTER IMPLEMENTATION PROMPT

## Role and mission

Act as a senior game developer, Three.js engineer, full-stack architect, simulation designer, historical research specialist, and UI/UX designer.

Build a completely new, standalone browser game called **Ocean Empire 3D**.

This is an independent project with its own codebase, website, game engine, database, design system, and deployment. It must not extend, import, modify, or depend on my existing Global Shipping Radar website or repository.

The game combines five major experiences:

1. **3D Ship Simulator** — sail ships across a realistic ocean with responsive controls.
2. **Maritime Empire Builder** — create and expand a civilization, develop ports, manage territory, and grow an economy.
3. **Historical Civilization Campaigns** — experience different maritime civilizations and historical eras.
4. **Global Trade and Fleet Management** — operate ships, transport cargo, establish profitable routes, and manage fleets.
5. **Historical World Encyclopedia** — explore documented history, ships, ports, leaders, technologies, trade networks, and historical events.

The game should feel like a combination of a realistic maritime simulator, a grand strategy game, a shipping tycoon game, and a historical world-building game.

The 3D ocean and ships are the visual attraction. Empire development, economic decisions, historical discovery, and progression provide the long-term gameplay.

Do not build merely a static website, dashboard mockup, landing page, or collection of non-functional screens.

The final result must be a playable game.

---

# PART 1 — GAME VISION AND DESIGN

## 1.1 Two major game modes

The application must have two distinct game modes sharing appropriate rendering, navigation, persistence, and simulation infrastructure.

### Mode A: Historical Empire Campaign

Players choose a historically grounded civilization or political entity and begin in a selected historical scenario.

They can:
- Create or customize an empire where the scenario permits it.
- Establish maritime trade routes.
- Sail historically appropriate ships.
- Develop ports and settlements.
- Acquire or negotiate access to trading ports.
- Build fleets and shipyards.
- Transport historically appropriate goods.
- Earn income and develop a treasury.
- Research era-appropriate technologies.
- Interact with other civilizations.
- Negotiate trade agreements and diplomatic arrangements.
- Expand commercial influence.
- Complete historical missions.
- Explore historical events and their consequences.
- Develop their civilization over a campaign.

Historical campaigns must use appropriate dates, technologies, political entities, ship types, trade goods, and geographical context.

Do not mix civilizations, flags, rulers, ships, technologies, or political borders from incompatible historical periods.

### Mode B: Modern Shipping Empire

Players create a modern shipping company and develop it into a global maritime logistics business.

They can:
- Start with a small feeder container ship.
- Accept shipping contracts.
- Transport containers between international ports.
- Set routes and destinations.
- Navigate ships manually or with autopilot.
- Pay fuel, port fees, and operating costs.
- Earn money from cargo deliveries.
- Purchase larger ships.
- Manage multiple vessels.
- Assign ships to commercial routes.
- Upgrade fleet efficiency.
- Expand into international markets.
- Monitor company finances.
- Save and continue their progress.

Modern shipping gameplay must use modern vessels, port infrastructure, and commercial rules.

Do not apply medieval empire rules to the modern company mode.

---

# PART 2 — TECHNOLOGY STACK

## 2.1 Core application

Use:
- Next.js with App Router.
- TypeScript with strict type checking.
- React.
- Tailwind CSS.
- Zustand for client-side game state.
- Lucide icons for interface elements.

## 2.2 3D rendering

Use:
- Three.js.
- React Three Fiber.
- Drei where useful.
- Optimized GLB or glTF ship models.
- Procedural ocean effects when appropriate.
- Efficient lighting, materials, camera controls, and animation.

The game must work in a desktop browser without requiring a native application.

## 2.3 Global geography

Use a suitable globe or geographic map implementation, such as MapLibre GL JS with globe support or another compatible globe library.

Use real geographic coordinates for cities, ports, and maritime locations.

Do not position ports arbitrarily on the map.

Keep the global geographic view separate from the detailed local 3D sailing environment.

## 2.4 Persistence and database

Use Supabase with PostgreSQL for optional:
- User accounts.
- Saved campaigns.
- Player empires.
- Owned ships.
- Fleet assignments.
- Port development.
- Trade contracts.
- Historical campaign progress.
- Achievements.

The initial game must also work without Supabase credentials using local development persistence.

Never expose privileged database credentials in client-side code.

## 2.5 Deployment

Prepare the project for independent deployment to Vercel.

Do not depend on the deployment, APIs, repository, domain, or data of my existing Global Shipping Radar project.

Avoid paid APIs and mandatory AI services in the first version.

Use locally available or properly licensed assets and deterministic game data wherever possible.

---

# PART 3 — VISUAL DESIGN AND USER EXPERIENCE

## 3.1 Art direction

Create a polished, immersive maritime game with:
- Realistic-looking deep blue ocean.
- Animated waves.
- Sunlight and reflections.
- Atmospheric fog.
- Sky and horizon.
- Ship wakes and foam trails.
- Detailed container ships and historically appropriate sailing vessels.
- Realistic-looking ports and maritime infrastructure.
- Smooth camera transitions.
- Clear navigation markers.
- A professional shipping management interface.

Use a cohesive palette of navy, ocean blue, white, cyan, and carefully selected historical accent colors.

Avoid generic admin-dashboard styling.

The game should feel like a dedicated commercial game rather than a business application with a 3D object inserted into it.

## 3.2 Main menu

Create the following entries:
- New Game.
- Continue Game.
- Historical Campaigns.
- Modern Shipping Empire.
- Civilization Encyclopedia.
- Shipyard.
- Fleet Management.
- Settings.

Show the player's current empire or company, treasury, progress, and active campaign when a save exists.

## 3.3 Navigation structure

Use a clear navigation hierarchy:

- World.
- Empire.
- Fleet.
- Trade.
- Ports.
- Technology.
- Diplomacy.
- History.
- Missions.
- Settings.

Hide or disable features that are not applicable to the current scenario.

For example, historical sailing vessels should not display modern engine throttle controls, and modern shipping companies should not display medieval dynasty mechanics.

## 3.4 Responsive interface

Support desktop and tablet layouts.

Use collapsible panels, overlays, tooltips, informative vessel cards, accessible controls, clear notifications, and confirmation dialogs for important actions.

The ocean should remain the main visual focus during sailing.

---

# PART 4 — THE 3D SHIP SIMULATOR

## 4.1 Sailing environment

Build a dedicated full-screen 3D sailing scene containing:
- Ocean surface.
- Sky and horizon.
- Sunlight and ambient lighting.
- Player ship.
- Ship wake.
- Camera controls.
- Navigation HUD.
- Optional AI vessels.
- Distant environmental features where appropriate.

The scene should be attractive even when external 3D models are unavailable.

Provide an original procedural fallback ship model built from geometry, materials, and basic ship components.

Do not make the game dependent on external model URLs that may disappear.

## 4.2 Ship movement

Implement real, responsive movement.

Each ship should have:
- Geographic position.
- Heading.
- Speed.
- Acceleration.
- Turning rate.
- Movement state.
- Current waypoint.
- Route progress.
- Fuel or endurance where appropriate.
- Vessel-specific handling parameters.

Use elapsed frame time rather than fixed per-frame movement.

Implement:
- Gradual acceleration.
- Gradual deceleration.
- Smooth turning.
- Heading updates.
- Speed limits.
- Waypoint following.
- Destination detection.
- Pause and resume.
- Autopilot.
- Simulation time acceleration.

A ship must visibly move through the scene when the user changes its controls.

Turning must change the vessel's direction. Acceleration must change its speed. The wake must follow its actual movement.

Avoid simply translating a ship model along a straight line without accounting for its heading.

## 4.3 Controls

Desktop controls:
- W: increase throttle or sail propulsion.
- S: decrease throttle or propulsion.
- A: steer left.
- D: steer right.
- Space: pause or resume.
- C: cycle camera.
- Escape: open the game menu.

Also provide clickable controls.

Include:
- Third-person chase camera.
- Free camera.
- Overhead navigation camera.
- Camera zoom.
- Camera reset.
- Steering controls.
- Speed controls.
- Autopilot toggle.
- Waypoint selection.
- Simulation speed selection.

Keyboard controls must not interfere with text inputs or other interface elements.

## 4.4 Era-specific ship handling

Modern powered ships and historical sailing vessels must not use identical handling behavior.

Modern vessels:
- Engine throttle.
- Propulsion.
- Gradual turning.
- Fuel consumption.
- Modern navigation controls.

Historical sailing vessels:
- Sail propulsion.
- Wind direction and strength.
- Era-appropriate navigation abstractions.
- Vessel-specific turning and speed characteristics.
- Endurance and provisioning where appropriate.

For the first version, these mechanics may be simplified, but the architecture must support them independently.

Do not require an advanced aerodynamic simulation to make the first sailing prototype playable.

## 4.5 Navigation HUD

Display:
- Ship name.
- Ship type.
- Current speed.
- Heading.
- Position.
- Destination.
- Remaining distance.
- Estimated arrival time.
- Cargo capacity and current cargo.
- Fuel or provisions.
- Current waypoint.
- Autopilot status.
- Voyage progress.

The interface must distinguish between simulated information and verified real-world data.

---

# PART 5 — GLOBAL WORLD AND PORT SYSTEM

## 5.1 Global map

Create a global operations map or globe that displays:
- Major ports.
- Player-controlled ports.
- Trading ports.
- Fleet locations.
- Commercial routes.
- Historical trade routes.
- Available contracts.
- Diplomatic access.
- Historical territorial layers when applicable.

The global view is for planning and management, not for detailed ship steering.

Selecting a ship should allow the player to enter the local 3D sailing environment.

## 5.2 Initial port database

Include at least these modern port locations:
- Port Klang, Malaysia.
- Singapore.
- Tanjung Priok, Indonesia.
- Laem Chabang, Thailand.
- Shanghai, China.
- Hong Kong.
- Busan, South Korea.
- Rotterdam, Netherlands.
- Hamburg, Germany.
- Los Angeles, United States.
- New York, United States.
- Jebel Ali, United Arab Emirates.
- Mumbai, India.
- Colombo, Sri Lanka.
- Mombasa, Kenya.
- Alexandria, Egypt.
- Istanbul, Türkiye.
- Marseille, France.
- Santos, Brazil.
- Sydney, Australia.

Use accurate coordinates and appropriate port identities.

Do not assume that all modern ports existed in their present form during every historical period.

## 5.3 Historical ports

Historical ports must be represented through period-specific records.

Each record should support:
- Historical name.
- Modern reference name where applicable.
- Coordinates.
- Active period.
- Historical polity or authority.
- Available trade goods.
- Port infrastructure.
- Strategic or commercial importance.
- Historical notes.
- Source references.

The same geographic location may have different names, ownership, capabilities, and political significance across different periods.

## 5.4 Port interactions

When selecting a port, display:
- Port name.
- Historical or modern identity.
- Current owner or governing authority within the scenario.
- Available goods.
- Trade opportunities.
- Port fees.
- Infrastructure.
- Shipyard capabilities.
- Active contracts.
- Historical background.
- Available actions.

Allow appropriate actions such as:
- Dock.
- Load cargo.
- Unload cargo.
- Repair.
- Refuel.
- Upgrade infrastructure.
- Build ships.
- Negotiate access.
- Establish a trade agreement.

Actions must be validated against the current game state.

---

# PART 6 — EMPIRE CREATION AND CIVILIZATIONS

## 6.1 Empire creation

Allow players to create a custom empire in sandbox mode.

Settings:
- Empire name.
- Civilization or historical inspiration.
- Starting capital or home port.
- Flag or emblem.
- Starting treasury.
- Starting fleet.
- Difficulty.
- Starting historical period.
- Objectives.
- Sandbox or historical campaign rules.

Historical campaigns must distinguish authentic historical identities from player-created alternatives.

Do not automatically label a fictional empire as a real historical state.

## 6.2 Civilization selection

Build a civilization selection interface with:
- Civilization or polity name.
- Historical era.
- Start and end dates.
- Geographic region.
- Historical background.
- Principal cities or ports.
- Available vessels.
- Trade specializations.
- Technologies.
- Starting resources.
- Starting territory.
- Campaign objectives.
- Difficulty.
- Historical references.

Make civilization data modular so new civilizations can be added without rewriting the engine.

## 6.3 Initial civilization families

Design the data architecture to support at least the following historical families:

### Arabian Peninsula and Indian Ocean maritime networks

Explore the maritime commercial connections among Arabia, East Africa, India, and Southeast Asia.

Depending on the chosen scenario, include historically appropriate ports, sailing vessels, trade goods, navigation practices, political authorities, and commercial relationships.

Distinguish among different Arabian polities and historical periods.

### Abbasid-era maritime commerce

Represent a selected historical scenario involving the commercial networks and maritime connections associated with the Abbasid period.

Use period-appropriate dates, political context, ports, goods, and ships.

Do not treat the entire Islamic world as a single unchanging political entity.

### Srivijaya and Southeast Asian maritime trade

Develop a campaign inspired by the maritime networks associated with Srivijaya.

Represent its regional context, commercial connections, relevant ports, and appropriate historical uncertainties.

### Malacca Sultanate

Create a campaign inspired by the historical importance of Malacca as a Southeast Asian commercial and maritime center.

Represent its relevant period, trading networks, port development, political context, and commercial relationships.

Do not portray the Malacca Sultanate as identical to the modern Malaysian state.

### Chinese maritime civilizations

Support selected Song-era and Ming-era scenarios, including historical contexts associated with Chinese maritime commerce and the voyages of Zheng He.

Use period-appropriate ships, ports, trade goods, technologies, and historical references.

### Ancient Mediterranean maritime civilizations

Provide a framework for scenarios involving historically appropriate Mediterranean maritime trade, vessels, ports, and political powers.

### Venetian maritime commerce

Represent selected historical contexts involving Venice, merchant fleets, maritime trade, ports, and commercial relationships.

### Portuguese maritime expansion

Represent a selected period of Portuguese maritime activity using appropriate historical ships, routes, ports, and political context.

### Dutch maritime commerce

Support a historically grounded Dutch maritime trading scenario with appropriate commercial institutions, ships, ports, and trade networks.

### British maritime and commercial expansion

Represent selected periods of British maritime and commercial history without treating all centuries as one continuous scenario.

### Swahili coastal trading city-states

Represent historical East African coastal commercial networks and their relationships with the wider Indian Ocean world.

### Modern shipping company

Provide a non-historical scenario using contemporary shipping companies, container ships, modern ports, commercial contracts, and fleet management.

These are scenario families, not claims that every polity existed throughout every listed period.

Prioritize the first two playable campaigns before expanding the catalog.

---

# PART 7 — HISTORICAL KNOWLEDGE AND ACCURACY

## 7.1 Historical data is a core game system

Do not rely on AI-generated historical text as the authoritative source of game facts.

Create a structured, version-controlled historical database containing:
- Civilizations and political entities.
- Historical names.
- Historical dates.
- Rulers and leaders where relevant.
- Ports and settlements.
- Ship classes and shipbuilding traditions.
- Trade goods.
- Maritime routes.
- Technologies.
- Historical events.
- Political relationships.
- Historical territorial control.
- Sources and further reading.

Keep the historical database separate from mutable player game state.

## 7.2 Required historical data models

### Civilization

Fields:
- id.
- canonical_name.
- historical_names.
- region.
- start_date.
- end_date.
- political_context.
- description.
- historical_sources.

### HistoricalScenario

Fields:
- id.
- title.
- start_date.
- end_date.
- playable_polities.
- initial_territories.
- available_ports.
- starting_ships.
- starting_technologies.
- initial_economy.
- objectives.
- historical_events.
- sources.

### HistoricalEvent

Fields:
- id.
- title.
- date_or_date_range.
- location.
- involved_polities.
- summary.
- historical_significance.
- evidence_status.
- sources.

### HistoricalPort

Fields:
- id.
- modern_reference_name.
- historical_names.
- latitude.
- longitude.
- active_period.
- historical_polity.
- historical_significance.
- sources.

### HistoricalShip

Fields:
- id.
- name_or_class.
- vessel_type.
- civilization_or_region.
- earliest_documented_period.
- latest_documented_period.
- capabilities.
- historical_notes.
- sources.

### HistoricalSource

Fields:
- id.
- title.
- author_or_institution.
- publication_year.
- source_type.
- url_or_reference.
- related_records.

Use validated schemas and TypeScript types for these records.

## 7.3 Research standards

Use credible references, including:
- Academic publications.
- Museum collections.
- Established historical institutions.
- Archaeological evidence.
- Scholarly books.
- Reliable reference works.
- Reputable archives and historical databases.

Store source references alongside the records they support.

Never invent citations, source URLs, rulers, dates, events, or quotations.

If information is disputed, incomplete, or uncertain, record that uncertainty.

Clearly distinguish:
1. Established historical facts.
2. Scholarly interpretations.
3. Reasonable historical reconstructions.
4. Fictional gameplay additions.

A record in the database must not automatically be described as verified merely because it exists.

If external research is not available during implementation, create clearly labeled initial records with source fields and document which facts still require verification. Do not fabricate references to make the encyclopedia look complete.

## 7.4 Historical encyclopedia

Build an in-game encyclopedia where players can:
- Browse civilizations.
- Explore historical periods.
- Read about ports and settlements.
- Explore ship classes.
- Learn about trade networks.
- Read about important maritime figures.
- Browse historical events.
- Inspect historical maps.
- Explore technological developments.
- Read source notes and further reading.

Use short, readable entries.

Allow players to open the relevant encyclopedia entry from a port, ship, technology, civilization, or event.

Where useful, display historical names alongside modern reference names.

An optional AI history assistant may explain existing entries using retrieved source material. It must distinguish supported facts from uncertainty and must not invent missing historical information.

The main game and encyclopedia must function without an AI API key.

---

# PART 8 — TERRITORY, PORT DEVELOPMENT AND EMPIRE MANAGEMENT

## 8.1 Empire dashboard

Display:
- Empire name.
- Treasury.
- Income.
- Operating expenses.
- Net revenue.
- Population or prosperity indicators where appropriate.
- Owned or controlled territory.
- Ports and settlements.
- Fleet size.
- Active trade routes.
- Technology level.
- Stability.
- Diplomatic relationships.
- Current objectives.

The available statistics must depend on the selected scenario.

## 8.2 Territory system

Create a geographic territory model that supports:
- Regions.
- Settlements.
- Ports.
- Ownership.
- Access agreements.
- Commercial influence.
- Development levels.
- Historical time ranges.

Players may establish settlements, develop ports, negotiate access, or acquire territory according to the rules of their scenario.

Do not assume every port can be purchased or every territory can be acquired in the same way.

Historical campaigns may have scenario-specific territorial rules.

Modern shipping companies should generally focus on port access, commercial partnerships, facilities, and logistics rather than owning sovereign territory.

## 8.3 Port development

Allow players to invest in appropriate infrastructure, including:
- Docks.
- Warehouses.
- Shipyards.
- Cargo-handling facilities.
- Navigation facilities.
- Repair infrastructure.
- Administrative facilities.
- Commercial districts.

Infrastructure should have meaningful costs and benefits.

For example:
- Warehouses increase storage capacity.
- Shipyards unlock suitable vessels.
- Cargo facilities improve throughput.
- Navigation facilities improve route operations where the scenario supports them.
- Commercial districts improve trade opportunities.

Do not make all upgrades available in every historical period.

## 8.4 Empire stability

For scenarios where the system is relevant, include:
- Population.
- Prosperity.
- Public order.
- Workforce availability.
- Infrastructure requirements.
- Revenue and expenses.

Avoid adding complex population simulation before the first campaign is playable.

Start with a small number of meaningful indicators and expand only when needed.

---

# PART 9 — TRADE AND ECONOMY

## 9.1 Trade goods

Create structured commodity records with:
- id.
- name.
- description.
- historical availability.
- base price.
- cargo-space requirements.
- weight where relevant.
- supply and demand.
- available ports.
- storage requirements where appropriate.
- trade restrictions.
- source references when historical claims are made.

Potential goods include:
- Spices.
- Textiles.
- Ceramics.
- Tea.
- Timber.
- Metals.
- Grain.
- Salt.
- Pearls.
- Modern manufactured goods.
- Modern containerized cargo.

Do not make every good available in every era.

## 9.2 Economic simulation

Implement:
- Cargo purchasing and selling.
- Contract rewards.
- Transport costs.
- Fuel or provisioning expenses.
- Port fees.
- Ship maintenance.
- Port development costs.
- Trade income.
- Treasury management.
- Investment returns where appropriate.

Prices may change according to supply, demand, port specialization, events, and scenario rules.

Use deterministic or seeded simulation data for reproducible tests.

Game balance values must be labeled as gameplay abstractions, not real historical prices unless independently documented.

Prevent invalid transactions, duplicate payments, impossible cargo quantities, and unintended negative balances.

## 9.3 Contract system

Each contract should contain:
- Origin.
- Destination.
- Cargo.
- Quantity.
- Deadline.
- Payment.
- Estimated costs.
- Expected profit.
- Status.
- Assigned vessel.
- Completion state.

Only offer contracts that the selected ship can carry and that have valid routes and compatible ports.

Award payment once, after successful completion.

Show a voyage-completed report including revenue, expenses, penalties or bonuses, and net profit.

---

# PART 10 — FLEET AND SHIPBUILDING

## 10.1 Ship catalog

Create a data-driven vessel catalog.

Historical vessels may include period-appropriate:
- Arabian and Indian Ocean sailing vessels.
- Dhow-type vessels where supported by the selected scenario.
- Southeast Asian trading vessels.
- Chinese junks.
- Mediterranean merchant vessels.
- European merchant sailing ships.
- Steam-powered ships.

Modern vessels may include:
- Small feeder container ships.
- Feedermax vessels.
- Panamax container ships.
- Larger container ships.

Historical classifications must be researched and used carefully. Do not treat broad vessel names as identical designs across all periods.

## 10.2 Vessel data

Each ship should have:
- id.
- Name or class.
- Era.
- Civilization or region.
- Ship type.
- Cargo capacity.
- Speed characteristics.
- Handling parameters.
- Range or endurance.
- Fuel or provisioning requirements.
- Construction or purchase cost.
- Maintenance costs.
- Crew requirements where appropriate.
- Required shipyard.
- Required technology.
- Historical notes.
- Source references.

## 10.3 Fleet management

Allow players to:
- View owned ships.
- Inspect ship specifications.
- Purchase ships.
- Build ships where supported.
- Assign vessels to contracts.
- Assign vessels to trade routes.
- Inspect current locations.
- Monitor active voyages.
- Repair or maintain ships.
- Upgrade permitted attributes.
- Sell vessels where appropriate.

Validate treasury, shipyard availability, technologies, cargo capacity, and scenario rules before any transaction.

Prevent purchases when the player cannot afford the vessel.

---

# PART 11 — TECHNOLOGY AND PROGRESSION

## 11.1 Technology trees

Create modular technology trees that vary by scenario and period.

Potential branches:
- Shipbuilding.
- Navigation.
- Cartography.
- Port infrastructure.
- Cargo handling.
- Commercial administration.
- Maritime communication.
- Vessel efficiency.

Technology unlocks must have:
- Prerequisites.
- Costs.
- Era restrictions.
- Effects.
- Historical notes.
- Source references where applicable.

Do not present one universal technology tree as a factual description of every civilization.

Different civilizations may have distinct capabilities, resources, geography, and historical development.

## 11.2 Progression

Players should earn experience, money, influence, or other scenario-appropriate rewards through meaningful activities.

Progression may unlock:
- Additional ships.
- New trade goods.
- Better infrastructure.
- Additional ports.
- New contracts.
- New scenarios.
- Achievements.
- Technology.

Avoid requiring combat or territorial conquest as the only way to progress.

---

# PART 12 — DIPLOMACY AND AI CIVILIZATIONS

Build a modular diplomacy system.

AI-controlled entities should be able to:
- Operate fleets.
- Trade goods.
- Develop selected ports.
- Establish commercial relationships.
- Offer trade agreements.
- Negotiate port access.
- Compete over commercial opportunities.
- React to selected historical events.
- Maintain diplomatic relationships.

Possible diplomatic actions:
- Establish trade agreements.
- Request port access.
- Negotiate commercial partnerships.
- Propose alliances where appropriate.
- Apply embargoes.
- Resolve disputes.
- Compete for trade influence.

Diplomatic actions must have meaningful consequences.

Use scenario-specific rules.

War, conquest, and colonial expansion are optional gameplay systems, not mandatory paths to victory.

Where historical conflicts are represented, provide the appropriate context and distinguish historical events from fictional gameplay.

Implement AI behavior incrementally:
1. Basic economic agents.
2. Trade-route competition.
3. Port development.
4. Diplomatic decisions.
5. More advanced strategic behavior.

Do not attempt to build a sophisticated grand-strategy AI before the core game works.

---

# PART 13 — HISTORICAL TIMELINES, EVENTS AND CAMPAIGNS

## 13.1 Historical campaign structure

Each campaign should define:
- Start date.
- End date or campaign length.
- Initial polity.
- Initial territory.
- Initial treasury.
- Initial fleet.
- Available technologies.
- Available ports.
- Trade goods.
- Historical events.
- Objectives.
- Victory conditions.
- Failure conditions where appropriate.
- Historical source references.

## 13.2 Missions

Example mission themes:
- Establish a profitable Indian Ocean trading network.
- Develop a major Southeast Asian commercial port.
- Transport goods between historically appropriate ports.
- Improve shipbuilding capabilities.
- Expand merchant fleet capacity.
- Maintain a trading network during economic disruption.
- Establish diplomatic access to a strategic port.
- Complete a modern container delivery before a deadline.

When a mission is inspired by actual history, distinguish documented events from modified objectives and fictional outcomes.

## 13.3 Historical events

Events may affect:
- Port access.
- Trade demand.
- Technology availability.
- Diplomatic relationships.
- Shipping routes.
- Costs and revenue.
- Available ships.
- Campaign objectives.

Do not generate major historical events randomly and then present them as documented history.

Randomized events must be labeled as fictional or simulated.

## 13.4 Alternate history

Provide an optional sandbox where players can change historical outcomes.

Clearly label alternate-history results as fictional.

Do not modify the underlying historical database when the player changes the game world.

---

# PART 14 — HISTORICAL AND MODERN MAP LAYERS

Support separate geographic layers for:
- Modern international borders.
- Historical territorial control.
- Port ownership.
- Trade networks.
- Maritime routes.
- Settlements.
- Historical influence regions.

Historical boundaries must include applicable dates and sources.

Do not use present-day political borders as if they were valid for every historical period.

If precise historical boundary data is unavailable, display a clearly labeled approximate region rather than fabricate precise borders.

Keep geographic positions consistent across the global map, local sailing scenes, ports, and voyage calculations.

---

# PART 15 — SAVE SYSTEM AND DATABASE DESIGN

## 15.1 Save system

Implement a persistence abstraction independent of the rendering engine.

Save:
- Player profile.
- Empire or company.
- Game mode.
- Current scenario.
- Historical date.
- Treasury.
- Owned territory.
- Port development.
- Technology.
- Diplomatic relationships.
- Owned ships.
- Ship locations.
- Active voyages.
- Contracts.
- Cargo.
- Completed missions.
- Achievements.
- Settings.
- Tutorial progress.

Support:
- New Game.
- Continue Game.
- Save Game.
- Reset Game with confirmation.

Handle corrupted or missing save data gracefully.

## 15.2 Database structure

Design appropriately normalized tables or equivalent data structures for:
- Users.
- Saves.
- Empires.
- Territories.
- Ports.
- Ships.
- Fleets.
- Voyages.
- Contracts.
- Cargo.
- Technologies.
- Diplomacy.
- Historical scenarios.
- Historical events.
- Historical sources.
- Achievements.

Keep immutable historical reference data separate from player-specific mutable state.

Use suitable ownership policies and access controls if Supabase is configured.

Do not require database setup for local development.

---

# PART 16 — FIRST PLAYABLE RELEASE

Do not attempt to implement the entire game at once.

Build a complete vertical slice with real gameplay.

## 16.1 Required first release

Implement:

1. Main menu.
2. New Game and Continue Game.
3. A working 3D ocean.
4. A controllable vessel.
5. Smooth movement and camera controls.
6. Autopilot and waypoint navigation.
7. A global port map.
8. Port selection.
9. Cargo contracts.
10. Fuel or provisioning costs.
11. Treasury and income.
12. Ship purchasing.
13. Basic fleet management.
14. Empire creation.
15. Historical encyclopedia structure.
16. Save and restore.
17. One playable Arabian maritime trade campaign.
18. One playable Southeast Asian maritime campaign.
19. One playable modern shipping company scenario.

The historical campaigns should be separate scenarios with their own dates, ship catalogs, ports, goods, and political context.

The modern scenario should use modern ships, modern port facilities, and commercial logistics.

## 16.2 First playable historical campaign

Create an initial campaign inspired by Arabian and Indian Ocean maritime commerce.

The campaign should:
- Present the historical setting and date.
- Explain the selected polity and its context.
- Start the player with a suitable vessel, treasury, and home port.
- Offer an appropriate cargo contract.
- Allow the player to sail to a valid destination.
- Complete the delivery.
- Calculate income and expenses.
- Update the treasury.
- Allow investment in an appropriate port or trading capability.
- Save the campaign.
- Display historical notes and references.

Choose a specific, supportable historical scenario instead of combining several centuries into a fictional historical state.

## 16.3 Second historical campaign

Create a separate campaign inspired by Srivijaya or the Malacca Sultanate.

Choose the scenario based on available reliable historical evidence and implement:
- Period-appropriate ports.
- Appropriate ships.
- Suitable trade goods.
- A historically grounded starting situation.
- A distinct campaign objective.
- Source-backed historical background.

Do not simply reskin the Arabian campaign. The data, ports, goods, ships, and historical context should differ.

## 16.4 Modern shipping campaign

Create a modern shipping company scenario with:
- A small feeder container ship.
- Starting capital.
- Cargo contracts.
- Port Klang and Singapore as initial tutorial locations.
- Fuel and port fees.
- Delivery rewards.
- Ship purchases.
- Fleet management.
- Voyage history.

The player must be able to complete the tutorial without requiring a real-world vessel tracking API.

---

# PART 17 — TESTING AND PERFORMANCE

## 17.1 Automated tests

Test:
- Geographic distance calculations.
- Heading calculations.
- Geographic interpolation.
- Ship acceleration.
- Ship turning.
- Autopilot waypoint progression.
- Arrival detection.
- Voyage duration.
- Fuel consumption.
- Cargo capacity.
- Contract validation.
- Treasury transactions.
- Duplicate reward prevention.
- Ship purchasing.
- Port development costs.
- Technology prerequisites.
- Save and restore.
- Historical scenario date validation.
- Historical ship availability.
- Historical goods availability.
- Tutorial completion.

## 17.2 Performance

Optimize for ordinary desktop browsers.

Requirements:
- Dynamic import for browser-only 3D components.
- No browser-dependent Three.js execution during server rendering.
- Efficient animation loops.
- Avoid unnecessary React re-renders on every frame.
- Manage and dispose of geometry, materials, and textures.
- Optimize shadow maps and device pixel ratio.
- Limit excessive particles and geometry.
- Handle window resizing.
- Provide low, medium, and high quality settings.
- Gracefully handle unavailable WebGL.
- Reduce unnecessary rendering when the game is not visible where practical.

Do not claim a specific frame rate unless it has been tested.

## 17.3 Quality assurance

Run:
- TypeScript checks.
- Linting.
- Unit tests.
- Integration tests where applicable.
- Production build.

Fix errors instead of suppressing them.

Test the entire first playable campaign from starting a new game to completing a voyage and saving progress.

Do not claim that tests or deployment succeeded unless they actually did.

---

# PART 18 — IMPLEMENTATION WORKFLOW

Follow this order.

### Phase 1: Project foundation

- Create the standalone Next.js project.
- Establish TypeScript and styling.
- Build the main menu.
- Establish game state and persistence abstractions.
- Set up the 3D rendering environment.

### Phase 2: Ship simulator

- Build the ocean.
- Add the initial ship.
- Implement movement and steering.
- Add cameras.
- Add the navigation HUD.
- Add waypoints and autopilot.
- Test movement thoroughly.

### Phase 3: Global geography

- Implement the global map.
- Add port records and coordinates.
- Implement port selection.
- Add route planning.
- Connect geographic positions to local sailing scenes.

### Phase 4: Modern shipping gameplay

- Implement contracts.
- Add fuel and port fees.
- Implement income and expenses.
- Add ship purchasing.
- Build fleet management.
- Implement the Port Klang-to-Singapore tutorial.

### Phase 5: Empire engine

- Implement empire creation.
- Add treasury, territories, ports, and development.
- Add trade goods and economic simulation.
- Add shipyards and technology.
- Add basic progression.

### Phase 6: Historical knowledge

- Implement the historical data models.
- Add source-backed civilization and port records.
- Create the encyclopedia.
- Add historical timelines.
- Validate dates, ships, goods, and technologies.

### Phase 7: Historical campaigns

- Implement the Arabian maritime campaign.
- Implement the Southeast Asian maritime campaign.
- Add appropriate ships and goods.
- Add historical objectives.
- Add port development and trade progression.
- Ensure the campaigns are genuinely playable.

### Phase 8: Advanced empire systems

After the core game works, add:
- Diplomacy.
- AI-controlled trading powers.
- More civilizations.
- More historical eras.
- Additional technologies.
- More advanced territory management.
- Additional historical events.

### Phase 9: Final validation

- Test all critical flows.
- Fix errors.
- Run the production build.
- Document setup and configuration.
- Prepare independent Vercel deployment instructions.

---

# PART 19 — DEVELOPMENT RULES

Follow these rules throughout development.

1. Inspect the current working directory before changing files.
2. Create a new project independently from Global Shipping Radar.
3. Do not import or reuse code from that project unless I explicitly provide and authorize specific reusable assets.
4. Do not build every feature in one giant component.
5. Keep the simulation engine separate from UI rendering.
6. Keep historical reference data separate from mutable game state.
7. Keep modern shipping mechanics separate from era-specific historical mechanics.
8. Do not use static screenshots in place of working 3D gameplay.
9. Do not create buttons that do nothing.
10. Do not invent historical facts or sources.
11. Do not require paid services for the initial playable release.
12. Use sensible fallbacks for missing external assets.
13. Use deterministic game data where it improves reliability and testing.
14. Prioritize a working playable experience over an enormous collection of incomplete features.
15. Do not stop after creating a project scaffold or static UI.
16. Keep the code modular so additional civilizations and historical scenarios can be added through structured data.
17. Document incomplete features honestly.
18. Preserve a clean, maintainable architecture.
19. Avoid unnecessary dependencies and premature complexity.
20. Complete and test the first playable vertical slice before expanding the scope.

---

# PART 20 — FINAL DEFINITION OF DONE

The initial release is complete only when the player can perform the following actions.

### Modern shipping mode

1. Open the standalone website.
2. Start a new company.
3. Receive a starter ship and starting capital.
4. Accept a cargo contract.
5. Select a destination.
6. Enter a real-time 3D ocean scene.
7. Control the vessel manually or use autopilot.
8. Watch the ship move and turn smoothly.
9. Complete a voyage.
10. Receive payment and pay operating costs.
11. Buy another ship when affordable.
12. Inspect the fleet and voyage history.
13. Save and resume the game.

### Historical empire mode

1. Create or select an empire.
2. Select a supported historical scenario.
3. Read the historical background and source references.
4. Start with period-appropriate resources and ships.
5. Sail a vessel in the 3D environment.
6. Transport goods between appropriate ports.
7. Earn income and pay expenses.
8. Develop a port or expand a trade network.
9. Invest in a valid technology or infrastructure upgrade.
10. Inspect relevant historical entries and sources.
11. Save and resume the campaign.

The game must have a functional historical database, a working economy, real ship movement, and a coherent first campaign.

Do not present incomplete historical content as fully researched.

Do not present mock functionality as implemented functionality.

# FINAL INSTRUCTION

Start by inspecting the development environment and creating the new standalone Ocean Empire 3D project.

Implement the foundation, then build and test the first complete playable experience.

The long-term objective is to create a rich, historically grounded maritime world where players can sail ships in 3D, establish trading networks, develop ports, build fleets, manage civilizations, and grow maritime empires across different historical eras.

Keep the initial scope achievable, but design the architecture to support that larger vision.
