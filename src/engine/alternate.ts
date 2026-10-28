import type { ScenarioCatalog } from "@/data";
import type { HistoricalEvent, HistoricalEventEffect } from "@/data/schemas";
import { uid } from "@/lib/utils";
import { applyEvent } from "./events";
import { reactToEvent } from "./rivals";
import type { Divergence, DivergenceChoice, GameNotification, GameState } from "./state";

/**
 * Alternate-history sandbox (brief 13.4). Documented events stay exactly as recorded in the
 * database; what the sandbox changes is only the simulated consequence the game applies.
 *
 * A turning point is any event with a gameplay effect. When one falls due in a sandbox game
 * the simulation pauses and the player chooses one of up to four outcomes:
 *
 *  - historical: the documented consequence applies, as in a historical game;
 *  - averted:    nothing happens in the game world;
 *  - softened:   closures become restrictions and every multiplier moves half as far;
 *  - reversed:   the consequence is turned around (a closure becomes an opening, a price
 *                rise a fall, a loss of standing a gain).
 *
 * Every choice other than "historical" is recorded as a divergence and labelled fiction
 * wherever it is shown. Decisions can also be set in advance from the History screen.
 */

export const CHOICE_LABELS: Record<DivergenceChoice, { label: string; short: string }> = {
  historical: { label: "Let it happen as documented", short: "as documented" },
  averted: { label: "Avert it", short: "averted" },
  softened: { label: "Soften it", short: "softened" },
  reversed: { label: "Turn it around", short: "reversed" },
};

/** Events that do something in the game world; notices are not turning points. */
export function isTurningPoint(event: HistoricalEvent): boolean {
  return event.effects.some((e) => e.type !== "notice");
}

function halfway(multiplier: number): number {
  return Math.round((1 + (multiplier - 1) / 2) * 100) / 100;
}

function inverse(multiplier: number): number {
  return Math.round((1 / multiplier) * 100) / 100;
}

/** The effects the game applies under a given choice. Never mutates the event. */
export function alteredEffects(event: HistoricalEvent, choice: DivergenceChoice): HistoricalEventEffect[] {
  switch (choice) {
    case "historical":
      return event.effects;
    case "averted":
      return event.effects.filter((e) => e.type === "notice");
    case "softened":
      return event.effects.flatMap((e): HistoricalEventEffect[] => {
        switch (e.type) {
          case "port_access":
            return e.access === "closed" ? [{ ...e, access: "restricted" }] : e.access === "restricted" ? [{ ...e, access: "open" }] : [e];
          case "port_fee_modifier":
          case "good_price_modifier":
            return [{ ...e, multiplier: halfway(e.multiplier) }];
          case "relation_change":
            return [{ ...e, delta: Math.round(e.delta / 2) }];
          case "campaign_end":
            return [];
          case "notice":
            return [e];
        }
      });
    case "reversed":
      return event.effects.flatMap((e): HistoricalEventEffect[] => {
        switch (e.type) {
          case "port_access":
            return e.access === "closed" || e.access === "restricted" ? [{ ...e, access: "open" }] : e.access === "open" ? [{ ...e, access: "restricted" }] : [e];
          case "port_fee_modifier":
          case "good_price_modifier":
            return [{ ...e, multiplier: inverse(e.multiplier) }];
          case "relation_change":
            return [{ ...e, delta: -e.delta }];
          case "campaign_end":
            return [];
          case "notice":
            return [e];
        }
      });
  }
}

/** Plain-words description of one effect, with real names from the catalog. */
export function describeEffect(catalog: ScenarioCatalog, e: HistoricalEventEffect): string {
  const port = (id: string) => catalog.portMap.get(id)?.name ?? id;
  const good = (id: string) => catalog.goodMap.get(id)?.name.toLowerCase() ?? id;
  const polity = (id: string) => catalog.civilizations.find((c) => c.id === id)?.canonical_name ?? id;
  const pct = (m: number) => `${m >= 1 ? "+" : ""}${Math.round((m - 1) * 100)}%`;
  switch (e.type) {
    case "port_access":
      return `${port(e.port_id)} becomes ${e.access}`;
    case "port_fee_modifier":
      return `fees at ${port(e.port_id)} ${pct(e.multiplier)}`;
    case "good_price_modifier":
      return `${good(e.good_id)} prices ${pct(e.multiplier)}`;
    case "relation_change":
      return `relations with ${polity(e.polity_id)} ${e.delta > 0 ? "+" : ""}${e.delta}`;
    case "campaign_end":
      return e.outcome === "historical_end" ? "the campaign ends" : `the campaign ends in ${e.outcome}`;
    case "notice":
      return "no gameplay effect";
  }
}

/** Describe what a choice would do, for the decision screen and the history timeline. */
export function describeChoice(catalog: ScenarioCatalog, event: HistoricalEvent, choice: DivergenceChoice): string {
  const effects = alteredEffects(event, choice).filter((e) => e.type !== "notice");
  if (effects.length === 0) return choice === "historical" ? "No gameplay effect." : "Nothing happens in the game world; the event is recorded as averted.";
  return effects.map((e) => describeEffect(catalog, e)).join("; ") + ".";
}

/** The choices that make sense for this event: softened and reversed only where they would differ from averted. */
export function divergenceOptions(event: HistoricalEvent): DivergenceChoice[] {
  const options: DivergenceChoice[] = ["historical", "averted"];
  const substantive = event.effects.filter((e) => e.type !== "notice" && e.type !== "campaign_end");
  if (substantive.length > 0) {
    options.push("softened", "reversed");
  }
  return options;
}

function notify(state: GameState, kind: GameNotification["kind"], title: string, message: string, link?: string): GameState {
  const n: GameNotification = { id: uid("n"), sim_seconds: state.sim_seconds, kind, title, message, read: false, link };
  return { ...state, notifications: [n, ...state.notifications].slice(0, 60) };
}

/**
 * Apply an event under the chosen outcome: effects (possibly altered), rival reactions to
 * what actually happened, a notification, and a divergence record when the choice departs
 * from the documented consequence.
 */
export function resolveTurningPoint(catalog: ScenarioCatalog, state: GameState, event: HistoricalEvent, choice: DivergenceChoice): { state: GameState; notes: string[] } {
  const effective: HistoricalEvent = { ...event, effects: alteredEffects(event, choice) };
  let next = applyEvent(state, effective);
  const reaction = reactToEvent(catalog, next, effective);
  next = reaction.state;
  const decisions = { ...next.alternate_history.decisions, [event.id]: choice };
  let divergences = next.alternate_history.divergences;
  if (choice !== "historical") {
    const note = describeChoice(catalog, event, choice);
    const divergence: Divergence = { event_id: event.id, choice, sim_seconds: next.sim_seconds, date: next.date, note };
    divergences = [...divergences, divergence];
    next = notify(next, "event", `${event.title} (alternate history)`, `${CHOICE_LABELS[choice].label}: ${note} This outcome is fiction; the record is unchanged.`, "/play/history");
  } else {
    next = notify(next, "event", event.title, `${event.summary}${isTurningPoint(event) ? " Simulated consequences now apply." : ""}`, "/play/history");
  }
  next = { ...next, alternate_history: { ...next.alternate_history, decisions, divergences, pending_event_id: next.alternate_history.pending_event_id === event.id ? null : next.alternate_history.pending_event_id } };
  return { state: next, notes: reaction.notes };
}

/** Hold the game at a turning point until the player decides. */
export function holdTurningPoint(state: GameState, event: HistoricalEvent): GameState {
  const held = { ...state, paused: true, alternate_history: { ...state.alternate_history, pending_event_id: event.id } };
  return notify(held, "event", `Turning point: ${event.title}`, "History has reached a documented event with consequences for your trade. The game is paused until you decide what happens.", "/play/history");
}

/**
 * Decide a turning point. For the pending event the decision takes effect at once and the
 * game resumes; for an event still in the future it is stored and applied when the date comes.
 */
export function decideTurningPoint(catalog: ScenarioCatalog, state: GameState, eventId: string, choice: DivergenceChoice): { state: GameState; notes: string[] } {
  const event = catalog.events.find((e) => e.id === eventId);
  if (!event || state.empire.rules !== "sandbox") return { state, notes: [] };
  if (state.alternate_history.pending_event_id === eventId) {
    const resolved = resolveTurningPoint(catalog, state, event, choice);
    return { state: { ...resolved.state, paused: resolved.state.campaign.status === "active" ? false : true }, notes: resolved.notes };
  }
  if (state.applied_events.includes(eventId)) return { state, notes: [] };
  return { state: { ...state, alternate_history: { ...state.alternate_history, decisions: { ...state.alternate_history.decisions, [eventId]: choice } } }, notes: [] };
}

/** The pending turning point, if any. */
export function pendingTurningPoint(catalog: ScenarioCatalog, state: GameState): HistoricalEvent | null {
  const id = state.alternate_history.pending_event_id;
  return id ? (catalog.events.find((e) => e.id === id) ?? null) : null;
}
