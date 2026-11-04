import type { Scenario, VesselClass } from "@/data/schemas";
import type { ScenarioCatalog } from "@/data";
import { dateFromIso } from "@/engine/calendar";
import { windForDate, type Wind } from "@/engine/wind";

/**
 * Pure helpers for the landing page's live sea: the showcase vessel for each scenario, the
 * slow day cycle and the gentle meander the demo helm steers when nobody is at the wheel.
 * They are plain arithmetic so the menu's behaviour can be tested without a renderer.
 */

/** Real seconds for one dawn-to-dusk-to-dawn cycle on the landing page. */
export const DAY_CYCLE_SECONDS = 480;
/** Simulated seconds per real second for the demo ship (keeps motion visible at a glance). */
export const DEMO_TIME_SCALE = 3;
/** How long after the last helm input the demo autopilot takes the wheel back. */
export const MANUAL_HOLD_MS = 20_000;

/** Hour of the day (6.5 to 18.5) at real time `t`: opens mid-morning, climbs to dusk, dips to dawn and back, never night. */
export function demoHour(t: number): number {
  const phase = (2 * Math.PI * t) / DAY_CYCLE_SECONDS + Math.PI / 3;
  return 12.5 - 6 * Math.cos(phase);
}

/** The demo autopilot's rudder: a slow meander in [-0.3, 0.3] so the ship traces long arcs. */
export function demoRudder(t: number): number {
  return 0.2 * Math.sin(t / 37) + 0.08 * Math.sin(t / 11 + 1);
}

export interface Showcase {
  cls: VesselClass;
  accent: string;
  wind: Wind;
  shipName: string;
}

/** The vessel, livery colour and wind the landing page shows for a scenario. */
export function showcaseFor(scenario: Scenario, catalog: ScenarioCatalog): Showcase {
  const starting = scenario.starting_ships[0];
  const cls = (starting && catalog.ships.find((c) => c.id === starting.class_id)) ?? catalog.ships[0]!;
  const polity = scenario.player_polity_id ? catalog.civilizations.find((c) => c.id === scenario.player_polity_id) : undefined;
  const accent = polity?.color ?? "#22d3ee";
  const start = dateFromIso(scenario.start_date);
  const wind = scenario.features.wind ? windForDate(scenario.wind, start.month, start.day) : { from: 240, speed_knots: 10 };
  return { cls, accent, wind, shipName: starting?.name ?? cls.name_or_class };
}

/** Helm input from the page (keys and buttons). `manualUntil` is a performance.now() timestamp. */
export const menuHelm = { rudder: 0, throttle: 1, manualUntil: 0 };

/** Readout the page's HUD strip polls a few times a second. */
export const menuReadout = { speedKnots: 0, heading: 0, windFrom: 0, windKnots: 0, hour: 8, manual: false, sailEfficiency: null as number | null };

/** Clamp a throttle or sail setting to what the demo helm allows. */
export function clampThrottle(v: number): number {
  return Math.min(1, Math.max(0.15, Math.round(v * 20) / 20));
}
