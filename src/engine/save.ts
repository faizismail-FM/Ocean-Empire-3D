import { getScenario } from "@/data";
import { GameStateSchema, SAVE_VERSION, type GameState, type SaveSummary } from "./state";

/**
 * Serialisation and validation of saves, independent of where they are stored.
 */

export interface LoadResult {
  ok: true;
  state: GameState;
}
export interface LoadFailure {
  ok: false;
  error: string;
}

export function serializeState(state: GameState): string {
  return JSON.stringify({ ...state, updated_at: new Date().toISOString() });
}

export function parseState(raw: unknown): LoadResult | LoadFailure {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Save data is not valid JSON." };
    }
  }
  if (!data || typeof data !== "object") return { ok: false, error: "Save data is empty." };
  const version = (data as { version?: unknown }).version;
  if (version !== SAVE_VERSION) return { ok: false, error: `Unsupported save version ${String(version)} (expected ${SAVE_VERSION}).` };
  const parsed = GameStateSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `Save data failed validation${first ? ` at ${first.path.join(".")}: ${first.message}` : "."}` };
  }
  if (!getScenario(parsed.data.scenario_id)) return { ok: false, error: `Unknown scenario ${parsed.data.scenario_id}.` };
  return { ok: true, state: parsed.data };
}

export function summarizeState(state: GameState): SaveSummary {
  const scenario = getScenario(state.scenario_id);
  return {
    id: state.id,
    scenario_id: state.scenario_id,
    mode: state.mode,
    empire_name: state.empire.name,
    treasury: state.treasury,
    currency_symbol: scenario?.currency.symbol ?? "",
    date: state.date,
    ships: Object.keys(state.ships).length,
    contracts_completed: state.stats.contracts_completed,
    updated_at: state.updated_at,
    campaign_status: state.campaign.status,
  };
}
