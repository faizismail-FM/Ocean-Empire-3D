import type { GameState, SaveSummary } from "@/engine/state";
import { serializeState } from "@/engine/save";
import type { PersistenceAdapter } from "./adapter";

const INDEX_KEY = "ocean-empire:saves";
const SAVE_PREFIX = "ocean-empire:save:";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Browser localStorage adapter: the default, dependency-free persistence. */
export class LocalStorageAdapter implements PersistenceAdapter {
  readonly name = "local";

  async list(): Promise<SaveSummary[]> {
    const s = storage();
    if (!s) return [];
    try {
      const raw = s.getItem(INDEX_KEY);
      const parsed = raw ? (JSON.parse(raw) as SaveSummary[]) : [];
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.updated_at.localeCompare(a.updated_at)) : [];
    } catch {
      return [];
    }
  }

  async load(id: string): Promise<unknown | null> {
    const s = storage();
    if (!s) return null;
    const raw = s.getItem(SAVE_PREFIX + id);
    return raw ?? null;
  }

  async save(summary: SaveSummary, state: GameState): Promise<void> {
    const s = storage();
    if (!s) throw new Error("Browser storage is unavailable.");
    const index = (await this.list()).filter((x) => x.id !== summary.id);
    index.unshift(summary);
    s.setItem(SAVE_PREFIX + summary.id, serializeState(state));
    s.setItem(INDEX_KEY, JSON.stringify(index.slice(0, 20)));
  }

  async remove(id: string): Promise<void> {
    const s = storage();
    if (!s) return;
    s.removeItem(SAVE_PREFIX + id);
    const index = (await this.list()).filter((x) => x.id !== id);
    s.setItem(INDEX_KEY, JSON.stringify(index));
  }
}
