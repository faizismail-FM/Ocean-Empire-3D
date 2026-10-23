import type { GameState, SaveSummary } from "@/engine/state";
import type { PersistenceAdapter } from "./adapter";
import { LocalStorageAdapter } from "./local";
import { supabaseConfigured, SupabaseAdapter } from "./supabase";

/**
 * Local storage is always the source of truth for the running browser; when Supabase is
 * configured the same saves are mirrored there and merged into the Continue list.
 */
class CompositeAdapter implements PersistenceAdapter {
  readonly name: string;
  private local = new LocalStorageAdapter();
  private remote: PersistenceAdapter | null = null;

  constructor() {
    if (supabaseConfigured()) {
      try {
        this.remote = new SupabaseAdapter();
      } catch {
        this.remote = null;
      }
    }
    this.name = this.remote ? "local+supabase" : "local";
  }

  get hasRemote(): boolean {
    return this.remote !== null;
  }

  async list(): Promise<SaveSummary[]> {
    const local = await this.local.list();
    if (!this.remote) return local;
    const remote = await this.remote.list().catch(() => [] as SaveSummary[]);
    const byId = new Map<string, SaveSummary>();
    for (const s of [...remote, ...local]) {
      const existing = byId.get(s.id);
      if (!existing || existing.updated_at < s.updated_at) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async load(id: string): Promise<unknown | null> {
    const local = await this.local.load(id);
    if (local) return local;
    if (this.remote) return this.remote.load(id).catch(() => null);
    return null;
  }

  async save(summary: SaveSummary, state: GameState): Promise<void> {
    await this.local.save(summary, state);
    if (this.remote) await this.remote.save(summary, state).catch((err: unknown) => console.warn("Supabase save failed", err));
  }

  async remove(id: string): Promise<void> {
    await this.local.remove(id);
    if (this.remote) await this.remote.remove(id).catch(() => undefined);
  }
}

let adapter: CompositeAdapter | null = null;

export function getPersistence(): CompositeAdapter {
  if (!adapter) adapter = new CompositeAdapter();
  return adapter;
}

export type { PersistenceAdapter };
