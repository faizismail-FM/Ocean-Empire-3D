import type { GameState, SaveSummary } from "@/engine/state";
import { parseState, summarizeState } from "@/engine/save";
import { uid } from "@/lib/utils";
import type { PersistenceAdapter } from "./adapter";
import { LocalStorageAdapter } from "./local";
import { supabaseConfigured, SupabaseAdapter } from "./supabase";

/**
 * Local storage is always the source of truth for the running browser; when Supabase is
 * configured the same saves are mirrored there and merged into the Continue list, which is
 * what makes a signed-in account's saves appear on every device.
 */
class CompositeAdapter implements PersistenceAdapter {
  readonly name: string;
  private local = new LocalStorageAdapter();
  private remote: SupabaseAdapter | null = null;

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
    if (!this.remote) return local;
    // Prefer whichever copy is newer so progress made on another device wins.
    const remote = await this.remote.load(id).catch(() => null);
    if (!remote) return local;
    if (!local) return remote;
    const localUpdated = updatedAt(local);
    const remoteUpdated = updatedAt(remote);
    return remoteUpdated > localUpdated ? remote : local;
  }

  async save(summary: SaveSummary, state: GameState): Promise<void> {
    await this.local.save(summary, state);
    if (this.remote) await this.remote.save(summary, state).catch((err: unknown) => console.warn("Supabase save failed", err));
  }

  async remove(id: string): Promise<void> {
    await this.local.remove(id);
    if (this.remote) await this.remote.remove(id).catch(() => undefined);
  }

  /**
   * After signing in, push every local save to the account. A save whose id already
   * belongs to another user (an old anonymous identity on this device) is given a fresh id
   * so the player keeps it under the new account.
   */
  async migrateLocalSaves(): Promise<{ uploaded: number; reassigned: number }> {
    if (!this.remote) return { uploaded: 0, reassigned: 0 };
    let uploaded = 0;
    let reassigned = 0;
    for (const summary of await this.local.list()) {
      const raw = await this.local.load(summary.id);
      const parsed = raw ? parseState(raw) : null;
      if (!parsed || !parsed.ok) continue;
      try {
        await this.remote.save(summary, parsed.state);
        uploaded += 1;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "23505" && code !== "42501") continue;
        const cloned: GameState = { ...parsed.state, id: uid("save") };
        const newSummary = summarizeState(cloned);
        await this.local.save(newSummary, cloned);
        await this.local.remove(summary.id);
        try {
          await this.remote.save(newSummary, cloned);
          uploaded += 1;
          reassigned += 1;
        } catch {
          // Keep the local copy; it will be retried on the next autosave.
        }
      }
    }
    return { uploaded, reassigned };
  }
}

function updatedAt(raw: unknown): string {
  try {
    const obj = typeof raw === "string" ? (JSON.parse(raw) as { updated_at?: string }) : (raw as { updated_at?: string });
    return obj?.updated_at ?? "";
  } catch {
    return "";
  }
}

let adapter: CompositeAdapter | null = null;

export function getPersistence(): CompositeAdapter {
  if (!adapter) adapter = new CompositeAdapter();
  return adapter;
}

export type { PersistenceAdapter };
