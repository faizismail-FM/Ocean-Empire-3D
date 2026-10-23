import type { GameState, SaveSummary } from "@/engine/state";

/**
 * Storage abstraction. The game never talks to localStorage or Supabase directly; it
 * calls one of these adapters, so the renderer and the rules stay independent of
 * where saves live.
 */
export interface PersistenceAdapter {
  readonly name: string;
  list(): Promise<SaveSummary[]>;
  load(id: string): Promise<unknown | null>;
  save(summary: SaveSummary, state: GameState): Promise<void>;
  remove(id: string): Promise<void>;
}
