import type { ScenarioCatalog } from "@/data";
import type { HistoricalEvent } from "@/data/schemas";
import { dateFromIso, isSameOrAfter } from "./calendar";
import type { GameState } from "./state";

/** Events whose trigger date has arrived and which have not yet been applied. */
export function dueEvents(catalog: ScenarioCatalog, state: GameState): HistoricalEvent[] {
  return catalog.events.filter((e) => {
    if (!e.trigger_date || state.applied_events.includes(e.id)) return false;
    return isSameOrAfter(state.date, dateFromIso(e.trigger_date));
  });
}

/** Apply one event's gameplay effects. Returns the new state (never mutates the historical record). */
export function applyEvent(state: GameState, event: HistoricalEvent): GameState {
  let next: GameState = { ...state, applied_events: [...state.applied_events, event.id], ports: { ...state.ports }, diplomacy: { ...state.diplomacy } };
  for (const effect of event.effects) {
    switch (effect.type) {
      case "port_access": {
        const ps = next.ports[effect.port_id];
        if (ps && ps.access !== "home") next.ports[effect.port_id] = { ...ps, access: effect.access };
        break;
      }
      case "port_fee_modifier": {
        const ps = next.ports[effect.port_id];
        if (ps) next.ports[effect.port_id] = { ...ps, fee_multiplier: effect.multiplier };
        break;
      }
      case "relation_change": {
        const d = next.diplomacy[effect.polity_id];
        if (d) next.diplomacy[effect.polity_id] = { ...d, relation: Math.max(0, Math.min(100, d.relation + effect.delta)) };
        break;
      }
      case "campaign_end":
        next = {
          ...next,
          paused: true,
          campaign: { status: effect.outcome === "victory" ? "victory" : effect.outcome === "defeat" ? "defeat" : "historical_end", ended_sim_seconds: next.sim_seconds, end_note: event.effects_note ?? event.summary },
        };
        break;
      case "good_price_modifier":
      case "notice":
        break;
    }
  }
  return next;
}
