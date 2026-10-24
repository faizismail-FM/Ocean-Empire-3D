import { createClient, type AuthChangeEvent, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { GameState, SaveSummary } from "@/engine/state";
import type { PersistenceAdapter } from "./adapter";

/**
 * Optional Supabase mirror. Activated only when the public URL and anon key are present.
 *
 * Identity model:
 *  - Without signing in, each browser gets an anonymous Supabase user so its saves are
 *    owned by someone under row-level security (see supabase/migrations/0001_init.sql).
 *  - Signing in with an emailed link either upgrades that anonymous user to a permanent one
 *    (keeping every save id) or, when the email already belongs to an account, switches to
 *    that account. Saves then follow the account across devices.
 *
 * Only the public anon key is ever shipped to the client.
 */
export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  // Implicit flow: the sign-in link carries its tokens, so it works in whichever browser on
  // the device opens it (PKCE would require the same browser that requested the link).
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } });
  return client;
}

export interface AccountInfo {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

export function toAccountInfo(user: User | null): AccountInfo | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, isAnonymous: Boolean(user.is_anonymous) || !user.email };
}

let anonymousSignIn: Promise<string | null> | null = null;

/** The current user's id, creating an anonymous session when there is none. */
export async function ensureUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  if (!anonymousSignIn) {
    anonymousSignIn = supabase.auth
      .signInAnonymously()
      .then(({ data: anon, error }) => (error ? null : anon.user?.id ?? null))
      .finally(() => {
        anonymousSignIn = null;
      });
  }
  return anonymousSignIn;
}

export async function currentAccount(): Promise<AccountInfo | null> {
  const { data } = await getSupabaseClient().auth.getSession();
  return toAccountInfo(data.session?.user ?? null);
}

export function onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange(cb);
  return () => data.subscription.unsubscribe();
}

/** Where a sign-in link should land: the main menu of the site that requested it. */
function redirectTarget(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/?signin=1`;
}

/**
 * Email a sign-in link. An anonymous session is upgraded in place (so existing saves keep
 * their owner); otherwise a normal magic-link sign-in is started, creating the account on
 * first use. The link completes the sign-in on whichever device opens it.
 */
export async function requestEmailLink(email: string): Promise<"upgrade" | "signin"> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (user && (user.is_anonymous || !user.email)) {
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: redirectTarget() });
    if (!error) return "upgrade";
    // Typically "email already registered": fall through to a normal sign-in.
  }
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTarget() } });
  if (error) throw new Error(friendlyAuthError(error.message));
  return "signin";
}

export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) return "Too many emails were sent recently. Please wait a while and try again.";
  if (m.includes("expired")) return "That link has expired. Request a new one.";
  if (m.includes("invalid") || m.includes("token")) return "That sign-in link is not valid any more. Request a new one.";
  if (m.includes("signups not allowed")) return "Sign-ups are disabled for this project.";
  return message;
}

export class SupabaseAdapter implements PersistenceAdapter {
  readonly name = "supabase";

  async list(): Promise<SaveSummary[]> {
    const uid = await ensureUserId();
    if (!uid) return [];
    const { data, error } = await getSupabaseClient().from("saves").select("summary").eq("user_id", uid).order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => row.summary as SaveSummary);
  }

  async load(id: string): Promise<unknown | null> {
    const uid = await ensureUserId();
    if (!uid) return null;
    const { data, error } = await getSupabaseClient().from("saves").select("state").eq("user_id", uid).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data.state;
  }

  async save(summary: SaveSummary, state: GameState): Promise<void> {
    const uid = await ensureUserId();
    if (!uid) throw new Error("Could not sign in to Supabase.");
    const { error } = await getSupabaseClient().from("saves").upsert({
      id: summary.id,
      user_id: uid,
      scenario_id: summary.scenario_id,
      summary,
      state,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      const err = new Error(error.message) as Error & { code?: string };
      err.code = error.code;
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const uid = await ensureUserId();
    if (!uid) return;
    await getSupabaseClient().from("saves").delete().eq("user_id", uid).eq("id", id);
  }
}
