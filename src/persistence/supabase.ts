import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GameState, SaveSummary } from "@/engine/state";
import type { PersistenceAdapter } from "./adapter";

/**
 * Optional Supabase mirror. Activated only when the public URL and anon key are present.
 * Uses anonymous auth so that each browser profile owns its rows under row-level security
 * (see supabase/migrations/0001_init.sql). Only the anon key is ever shipped to the client.
 */
export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export class SupabaseAdapter implements PersistenceAdapter {
  readonly name = "supabase";
  private client: SupabaseClient;
  private ready: Promise<string | null> | null = null;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase is not configured.");
    this.client = createClient(url, key);
  }

  private async userId(): Promise<string | null> {
    if (!this.ready) {
      this.ready = (async () => {
        const { data } = await this.client.auth.getSession();
        if (data.session?.user) return data.session.user.id;
        const { data: anon, error } = await this.client.auth.signInAnonymously();
        if (error) return null;
        return anon.user?.id ?? null;
      })();
    }
    return this.ready;
  }

  async list(): Promise<SaveSummary[]> {
    const uid = await this.userId();
    if (!uid) return [];
    const { data, error } = await this.client.from("saves").select("summary").eq("user_id", uid).order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => row.summary as SaveSummary);
  }

  async load(id: string): Promise<unknown | null> {
    const uid = await this.userId();
    if (!uid) return null;
    const { data, error } = await this.client.from("saves").select("state").eq("user_id", uid).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data.state;
  }

  async save(summary: SaveSummary, state: GameState): Promise<void> {
    const uid = await this.userId();
    if (!uid) throw new Error("Could not sign in to Supabase.");
    const { error } = await this.client.from("saves").upsert({
      id: summary.id,
      user_id: uid,
      scenario_id: summary.scenario_id,
      summary,
      state,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    const uid = await this.userId();
    if (!uid) return;
    await this.client.from("saves").delete().eq("user_id", uid).eq("id", id);
  }
}
