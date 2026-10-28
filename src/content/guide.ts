/**
 * Player guide content. One source feeds the full guide page, the in-game guide overlay
 * and the small "?" help tips on each screen, so the three never drift apart.
 */

export type GuideSectionId = "goal" | "loop" | "sailing" | "time" | "trade" | "fleet" | "ports" | "territory" | "rivals" | "technology" | "diplomacy" | "history" | "sandbox" | "saves" | "glossary";

export interface GuideSection {
  id: GuideSectionId;
  title: string;
  /** One sentence shown in help tips and the guide index. */
  summary: string;
  /** Short paragraphs or bullet points. */
  points: string[];
  /** Practical advice, shown in a highlighted box. */
  tips?: string[];
  /** Keyboard or control reference, when relevant. */
  controls?: Array<{ keys: string; action: string }>;
  /** Only shown when the scenario has this feature. */
  feature?: "technology" | "diplomacy" | "territory";
}

export const GUIDE: GuideSection[] = [
  {
    id: "goal",
    title: "What you are trying to do",
    summary: "Grow a shipping company or trading house by carrying cargo between real ports, and complete the scenario's missions.",
    points: [
      "You start with one ship, some money and a home port. Every delivery earns money; every day at sea costs fuel or provisions, crew upkeep and port fees.",
      "Each scenario has a list of missions (see the Missions screen). Complete them in any order; the final mission ends the campaign with a victory.",
      "Historical campaigns also run on a timeline of real events that change port access, prices and routes. The modern scenario is open-ended company building.",
      "Running out of money is not instantly fatal, but a negative treasury blocks purchases and upkeep keeps accruing, so keep a cash buffer for fuel and fees.",
    ],
    tips: ["Your first mission is always a short tutorial delivery from the home port. Finish it before accepting long-haul contracts."],
  },
  {
    id: "loop",
    title: "The core loop",
    summary: "Accept a contract, plot a course, depart, speed up time, arrive, get paid. Then buy more ships and repeat.",
    points: [
      "1. Trade screen: with a ship docked at a port, open the Contracts tab and accept one. Cargo is loaded immediately.",
      "2. Sail screen: pick the contract's destination from the Destination list. A route is plotted along real sea lanes.",
      "3. Press Depart. The autopilot follows the route and docks on arrival; you only steer by hand if you want to.",
      "4. Raise the time scale (60× or faster) to pass the voyage. The simulation keeps running while you manage other screens.",
      "5. On arrival the ship docks, the contract is paid, port fees are charged and a voyage report opens.",
      "6. Reinvest: more ships, port facilities, technology. Idle ships earn nothing, so keep every hull moving.",
    ],
    tips: ["Deliveries made two or more days before the deadline earn a 5% bonus; late deliveries lose 35% of the payment."],
  },
  {
    id: "sailing",
    title: "The sailing view",
    summary: "A 3D view of the active ship. Watch the autopilot work, change cameras, or take the helm yourself.",
    points: [
      "The top-left card shows speed, heading, position, destination, distance remaining and ETA. The compass tape shows your heading, the bearing to the destination (cyan diamond) and where the wind is coming from (gold triangle).",
      "The bottom bar holds throttle, rudder, autopilot and the destination list. Touching the throttle or rudder disengages the autopilot; press Autopilot to hand control back.",
      "Three cameras: Chase follows behind the ship, Free orbits with the mouse, Overhead is a north-up chart view. Zoom with + and −, reset with R.",
      "A red-and-white buoy marks the next waypoint. Sailing ships cannot sail straight into the wind: the wind panel turns red when you are 'in irons' and the autopilot tacks for you.",
      "Fuel (or provisions) are consumed every hour at sea. Running out leaves an engine ship drifting; refuel at any port from the Fleet screen.",
      "The dock at the bottom right opens any game screen without leaving the voyage; the ship keeps sailing while you trade, develop ports or read the history. Each screen also has a key (M for the World map, F for the Fleet, T for Trade), and the Sail entry in the sidebar brings you back to the helm.",
    ],
    controls: [
      { keys: "W / S", action: "Throttle or sail up and down" },
      { keys: "A / D", action: "Rudder to port or starboard (hold)" },
      { keys: "Space", action: "Pause or resume" },
      { keys: "C", action: "Cycle camera" },
      { keys: "+ / −", action: "Zoom" },
      { keys: "R", action: "Reset camera" },
      { keys: "?", action: "Open this guide" },
      { keys: "M / E / F / T / P", action: "Open the World, Empire, Fleet, Trade or Ports screen" },
      { keys: "G / N / V / J / O", action: "Technology, Diplomacy, Rivals, History or Missions (where the scenario has them)" },
      { keys: "Esc", action: "Game menu" },
    ],
  },
  {
    id: "time",
    title: "Time and ship speed",
    summary: "Ships move at realistic speeds, so voyages take game hours or days. Use the time scale to pass them.",
    points: [
      "1× is real time: one second on your clock is one second at sea. Container ships make 18 to 22 knots (about 35 to 40 km/h); medieval sailing ships 6 to 8 knots.",
      "60× means one game minute per real second: a 190 nautical-mile leg at 18 knots takes about 10 game hours, which is 10 real minutes at 60× or one minute at 600×.",
      "The water in the sailing view always moves past the hull at the ship's real speed, whatever the time scale. Scenery, ports and traffic approach faster at higher scales.",
      "Pause with Space or the pause button. The simulation also pauses while the browser tab is hidden.",
    ],
    tips: ["Use 600× for open-ocean legs and drop to 60× or 10× near ports so you can watch the arrival."],
  },
  {
    id: "trade",
    title: "Contracts and markets",
    summary: "Contracts pay a fixed sum on delivery. Markets let you buy goods cheaply where they are produced and sell where they are wanted.",
    points: [
      "Contracts appear at the port where a ship is docked and refresh weekly. Each shows payment, estimated voyage cost, expected profit and a deadline.",
      "A contract needs free cargo space on the chosen ship. Capacity is measured in TEU (containers) for modern ships and tonnes for historical ones.",
      "The Market tab lists local prices. Ports price goods they produce low and goods they import high; prices drift slowly and react to historical events.",
      "Cancelling an accepted contract costs a penalty, so check the deadline against the ETA before accepting.",
    ],
    tips: ["Expected profit already subtracts fuel and port fees. Prefer contracts whose destination also offers good return cargo."],
  },
  {
    id: "fleet",
    title: "Fleet and shipyard",
    summary: "Buy, rename, refuel and repair ships. Every hull costs upkeep daily, so size the fleet to the contracts you can fill.",
    points: [
      "Buy ships lists the vessel classes available in the scenario with price, capacity, speed and consumption. New ships appear at the port you choose.",
      "Condition falls slowly with distance sailed. A worn ship is worth less if sold and costs more to repair, so repair at a port with repair facilities before it drops far.",
      "Any docked ship can be given a destination from the Fleet screen; the Sail screen then lets you take the helm of the active ship.",
      "Voyage history records every arrival with revenue, costs and notes, which is the fastest way to see which routes actually pay.",
    ],
  },
  {
    id: "ports",
    title: "Ports and development",
    summary: "Ports have access levels and facilities. Build at your home port or where you hold an agreement to cut costs and raise payments.",
    points: [
      "Access levels: Home (half fees, free to build), Open, Agreement (reduced fees, can build), Restricted and Closed (cannot call). Historical events can change them.",
      "Facilities you can build: docks, warehouse, shipyard, cargo handling, navigation, repair, administration and a commercial district. Each level has a cost that scales with the scenario economy.",
      "Cargo handling at the origin raises contract payments; warehouses and the commercial district improve local market prices; administration raises daily customs income at home.",
      "In the modern scenario you must have called at a port before you can lease facilities there.",
      "Every port has a population, a prosperity score and a public-order score, shown in the port panel. Ship calls (yours and the rivals'), market turnover and facilities raise prosperity; closures, high fees and unrest lower it. A prosperous port offers more and better-paid contracts and a bigger market; disorder adds to port charges; facilities above level 2 need prosperity of 40 to staff; and your home port's prosperity feeds your standing and daily duties.",
    ],
  },
  {
    id: "territory",
    title: "Territory and influence",
    summary: "Sovereign territory is never for sale. Your house builds influence at ports, founds settlements where the sources attest merchant communities, and in some campaigns brings a smaller port under its protection.",
    feature: "territory",
    points: [
      "Every port shows your influence (0 to 100). It rises with your share of the port's traffic, the facilities you build and your holdings, and fades where you stop calling. Your home port is always at 100. The Empire screen summarises influence by region.",
      "Found a settlement (Ports screen or the port panel on the map) at a port you have called at, with influence of 25 and relations of 50 with its ruler. A settlement lets you build and buy ships there, draws an extra contract each week and cuts your fees as a trade agreement does. It costs a daily upkeep.",
      "Where the campaign's rules allow it (Kilwa and Melaka, not Siraf or Venice), a settled port with influence of 70, most of its traffic carried by your ships and the ruler's favour can be brought under your protection: lower fees, two extra contracts, and duties from its customs house at half the home rate. Great cities are never available, and the port's ruler resents it.",
      "Each campaign states its territorial rule on the scenario page, with the historical basis and its evidence rating. Settlements and dependencies are gameplay inventions; the encyclopedia keeps the documented rulers.",
    ],
    tips: ["Influence is earned by calling: a port you visit on every circuit will reach the settlement threshold on its own. Build a warehouse there to speed it up."],
  },
  {
    id: "rivals",
    title: "Rival trading powers",
    summary: "Other companies or merchant houses run their own fleets on the same ports and contract board. They take contracts, build up ports and can be courted into a partnership.",
    points: [
      "Each rival has a home port, a fleet and a personality: expansive rivals chase the best-paying contracts and buy ships quickly, steady ones run long regular services, cautious ones stay near home.",
      "A rival ship docked at a port where contracts are on offer may take one. It disappears from the board, and you are told when it happens at your home port or where one of your ships is berthed.",
      "Rival ships appear on the world map (Rival fleets layer) and in the sailing view when they pass nearby. The Rivals screen lists every ship, its destination and ETA.",
      "Traffic share: the share of recorded calls at a port. A rival above half the traffic raises your terminal charges there by 10%, so work several ports rather than one.",
      "Relations drift toward neutral, fall when you take contracts at a rival's home port, and rise with courtesies. At 60 you can propose a partnership: the rival stops bidding at your home port and your fees at its home port drop 10%. It lapses if relations fall below 35.",
      "Rivals buy and sell real goods. A rival ship with no contract buys at its port's market whatever sells best within reach and sells it on arrival, through the same markets you use: its purchases draw down the stock you see, and its sales push the local price down for the week. The Market tab shows the week's price pressure next to each price.",
      "Rivals trade with each other. Each posts charters at its home port, marked 'charter' on the Trade screen, that any carrier may take, you included: the rival pays on delivery, a partner pays 10% extra, and carrying one improves relations. Calling at another rival's home port costs a handling fee that goes to it. Rivals whose mutual standing reaches 70 form an alliance, stay out of each other's home ports and favour each other's charters; it breaks below 40.",
      "Rivals react to historical events: ships bound for a port that an event closes or makes expensive divert to the nearest open port (dropping any contract), a rival based there loses money, price booms draw rivals to the goods' suppliers, and a quarrel involving a rival's sovereign cools its standing with you. The Rivals screen lists each response.",
      "Rivals are fictional. Where a name recalls a historical community, the encyclopedia entry for that community is the place for the history; the rival's ships and decisions are gameplay.",
    ],
    tips: ["Accept the contract you want before leaving a port idle at high time scale: a rival berthed there may take it while you wait."],
  },
  {
    id: "technology",
    title: "Technology",
    summary: "Research improvements that make ships faster, cheaper to run or roomier. Each has prerequisites and a cost.",
    feature: "technology",
    points: [
      "Technologies are grouped by branch. A technology is available when its prerequisites are researched and you can afford it.",
      "Effects apply to the whole fleet immediately: speed, consumption, cargo, maintenance and port fee multipliers.",
      "In historical campaigns the technology list follows what was known in the period; its sources are in the Encyclopedia.",
    ],
  },
  {
    id: "diplomacy",
    title: "Diplomacy",
    summary: "Improve relations with neighbouring polities to open their ports and win trade agreements.",
    feature: "diplomacy",
    points: [
      "Each action costs money and raises relations. Port access needs relations of 55; a trade agreement needs 70 and cuts fees at their ports by 15%.",
      "Historical events can sour or improve relations on their own, so an agreement is worth securing before a known crisis.",
    ],
  },
  {
    id: "history",
    title: "History and the encyclopedia",
    summary: "Historical campaigns follow a dated timeline. Every port, ship, good and event carries sources and an evidence rating.",
    points: [
      "The History screen lists events that have happened and what they changed. Upcoming events are hidden unless the scenario reveals them.",
      "Evidence badges: Established, Interpretation, Reconstruction, Uncertain and Fictional. Gameplay numbers such as prices and speeds are abstractions even when the record is well documented.",
      "The world map's layers carry dates and sources: territorial control is drawn for the current game year from dated extents (direct rule solid, suzerainty and spheres dashed, every outline approximate), inland capitals and settlements appear for that year, ports can be coloured by the polity that holds them, and your own trade network can be overlaid. Present-day borders are only drawn on request in historical campaigns and are marked as reference only. The encyclopedia's Historical maps page adds a year slider.",
      "The Encyclopedia is available from the main menu without a game in progress.",
      "Where the deployment enables it, each encyclopedia entry has an 'Ask about this entry' box. The assistant answers only from that entry's record and listed sources, says when the record does not cover a question, and labels interpretation, reconstruction and fiction. Treat it as a reading aid, not a source: check the bibliography before relying on a detail.",
    ],
  },
  {
    id: "sandbox",
    title: "Alternate history (sandbox)",
    summary: "In a sandbox game history pauses at each turning point and you choose what happens. Changed outcomes are fiction and are labelled as such.",
    points: [
      "Choose Alternate history when creating a historical house. The documented timeline is the same; what changes is that the game asks you before applying an event's simulated consequence.",
      "A turning point is any dated event with a gameplay effect (a port closing, fees or prices moving, relations shifting, the campaign ending). When one falls due the game pauses and offers up to four outcomes: as documented, averted (nothing happens), softened (closures become restrictions, multipliers move half as far) or turned around (the opposite happens).",
      "Rivals react to what actually happened in your game, not to the record. Events without effects, such as a book being written, are announced as usual.",
      "You can decide in advance from the History screen so that a long voyage at high time scale is not interrupted. Decisions made later show up in the Divergences panel with the date and what the game did instead.",
      "Sandbox campaigns do not end on their historical date unless you let the ending event happen. The encyclopedia and every record in it are never altered by anything you choose.",
    ],
    tips: ["Averting a closure keeps a port open but also keeps its prices steady: the shortage that a closure creates elsewhere never happens, so judge each turning point by your own routes."],
  },
  {
    id: "saves",
    title: "Saving and accounts",
    summary: "The game autosaves every 30 seconds and when you leave. Sign in with your email to carry saves across devices.",
    points: [
      "Saves live in this browser. Use Save in the top bar at any time; Continue on the main menu lists every save.",
      "Signing in with an emailed link keeps your saves under one account so you can continue on another device. There is no password.",
      "Settings lets you export a save as a JSON file as a backup.",
    ],
  },
  {
    id: "glossary",
    title: "Glossary",
    summary: "Nautical terms used across the game.",
    points: [
      "Knot (kn): one nautical mile per hour, about 1.85 km/h.",
      "Nautical mile (nm): 1,852 metres, one minute of latitude.",
      "TEU: twenty-foot equivalent unit, the standard container size used for capacity.",
      "ETA: estimated time of arrival at the current speed.",
      "In irons: a sailing ship pointed too close to the wind to make way.",
      "Tacking: zig-zagging across the wind to make progress upwind.",
      "Port / starboard: left and right when facing the bow.",
      "Sea lane: a documented shipping corridor the autopilot follows; canals open in the year they were built.",
    ],
  },
];

export function guideSection(id: GuideSectionId): GuideSection {
  return GUIDE.find((s) => s.id === id)!;
}
