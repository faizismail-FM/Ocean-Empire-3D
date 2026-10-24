"use client";

import { create } from "zustand";
import { getPersistence } from "@/persistence";
import { currentAccount, onAuthChange, requestEmailLink, signOut as supabaseSignOut, supabaseConfigured, toAccountInfo, type AccountInfo } from "@/persistence/supabase";

/**
 * Account state for cross-device saves. Everything here is optional: without Supabase the
 * store reports `available: false` and the game keeps saving locally.
 *
 * Sign-in is by emailed link. When the link is opened, supabase-js completes the session
 * from the URL and the auth listener below records the account and uploads this device's
 * local saves to it.
 */
interface AuthStore {
  available: boolean;
  initialized: boolean;
  account: AccountInfo | null;
  step: "idle" | "sending" | "link_sent";
  pendingEmail: string | null;
  error: string | null;
  notice: string | null;
  /** Bumped whenever the signed-in account changes, so save lists can refresh. */
  accountVersion: number;
  init: () => void;
  sendLink: (email: string) => Promise<boolean>;
  cancel: () => void;
  signOut: () => Promise<void>;
  clearNotice: () => void;
}

let unsubscribe: (() => void) | null = null;

const MIGRATED_KEY = "ocean-empire:migrated-for";
function migratedFor(userId: string): boolean {
  try {
    return window.localStorage.getItem(MIGRATED_KEY) === userId;
  } catch {
    return false;
  }
}
function markMigrated(userId: string): void {
  try {
    window.localStorage.setItem(MIGRATED_KEY, userId);
  } catch {
    // Storage unavailable: migration simply runs again next time.
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  available: supabaseConfigured(),
  initialized: false,
  account: null,
  step: "idle",
  pendingEmail: null,
  error: null,
  notice: null,
  accountVersion: 0,

  init: () => {
    if (get().initialized || !get().available) return;
    set({ initialized: true });
    // Subscribe before anything else touches the client: creating the client parses a
    // sign-in link from the URL and emits SIGNED_IN, which must not be missed.
    unsubscribe?.();
    unsubscribe = onAuthChange((event, session) => {
      const next = toAccountInfo(session?.user ?? null);
      set({ account: next });
      if (event === "SIGNED_OUT") set({ accountVersion: get().accountVersion + 1 });
      // Upload this device's local saves to a permanent account once per account and
      // browser. Which event delivers the session depends on how the sign-in happened
      // (INITIAL_SESSION for a link opened in a new tab, SIGNED_IN otherwise), so the
      // decision is keyed on the account rather than on the event.
      if (next && !next.isAnonymous && !migratedFor(next.id)) {
        markMigrated(next.id);
        set({ step: "idle", pendingEmail: null, error: null });
        void getPersistence()
          .migrateLocalSaves()
          .then((m) => {
            set({
              accountVersion: get().accountVersion + 1,
              notice: m.uploaded > 0 ? `Signed in as ${next.email}. ${m.uploaded} save${m.uploaded === 1 ? "" : "s"} from this device now follow your account.` : `Signed in as ${next.email}. Your saves follow this account on any device.`,
            });
          });
      }
    });
    void currentAccount().then((account) => set((s) => (s.account ? s : { account })));
  },

  sendLink: async (email) => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      set({ error: "Enter a valid email address." });
      return false;
    }
    set({ step: "sending", error: null, notice: null });
    try {
      const kind = await requestEmailLink(trimmed);
      set({
        step: "link_sent",
        pendingEmail: trimmed,
        notice: kind === "upgrade" ? `Check ${trimmed} for a confirmation link. Opening it links this device's saves to that email.` : `Check ${trimmed} for a sign-in link. Open it on the device you want signed in; the link is valid for one hour.`,
      });
      return true;
    } catch (err) {
      set({ step: "idle", error: err instanceof Error ? err.message : "Could not send the link." });
      return false;
    }
  },

  cancel: () => set({ step: "idle", pendingEmail: null, error: null }),

  signOut: async () => {
    await supabaseSignOut();
    set({ account: null, step: "idle", pendingEmail: null, notice: "Signed out. Saves on this device stay here; new saves use a fresh anonymous identity.", error: null });
  },

  clearNotice: () => set({ notice: null, error: null }),
}));
