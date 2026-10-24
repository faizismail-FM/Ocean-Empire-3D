"use client";

import { useEffect, useState } from "react";
import { CloudOff, LogOut, Mail, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { Badge, Button } from "@/components/ui";

/**
 * Email sign-in for cross-device saves. Shown in Settings and on the main menu.
 * Without Supabase configured it explains that saves stay in this browser.
 */
export function AccountPanel({ compact = false }: { compact?: boolean }) {
  const auth = useAuthStore();
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  const [email, setEmail] = useState("");

  useEffect(() => {
    auth.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull the account's saves into the Continue list whenever the account changes.
  useEffect(() => {
    if (auth.accountVersion > 0) void refreshSaves();
  }, [auth.accountVersion, refreshSaves]);

  if (!auth.available) {
    return (
      <div className="flex items-start gap-2 text-xs text-foam/55">
        <CloudOff size={14} className="mt-0.5 shrink-0" />
        <span>Saves stay in this browser. Cross-device sync needs the optional Supabase setup described in the README.</span>
      </div>
    );
  }

  const signedIn = auth.account && !auth.account.isAnonymous;

  return (
    <div className={compact ? "space-y-2 text-sm" : "space-y-3 text-sm"}>
      {signedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-300" />
            <span className="text-foam">{auth.account?.email}</span>
            <Badge tone="green">synced</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void auth.signOut()}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      ) : auth.step === "link_sent" ? (
        <div>
          <p className="text-foam/80">{auth.notice}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void auth.sendLink(auth.pendingEmail ?? email)} disabled={auth.step !== "link_sent"}>
              Resend
            </Button>
            <Button size="sm" variant="ghost" onClick={auth.cancel}>
              Use a different email
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void auth.sendLink(email);
          }}
        >
          {!compact && <p className="text-foam/70">Sign in with your email to keep your saves on every device. We only send a sign-in link; there is no password.</p>}
          <div className="flex flex-wrap gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1" autoComplete="email" aria-label="Email address" />
            <Button size="sm" type="submit" disabled={auth.step === "sending"}>
              <Mail size={14} /> {auth.step === "sending" ? "Sending…" : "Email me a link"}
            </Button>
          </div>
          {compact && <p className="text-xs text-foam/50">Sign in to keep saves across devices. No password; we email a link.</p>}
        </form>
      )}
      {auth.error && <p className="text-xs text-coral-400">{auth.error}</p>}
      {auth.notice && auth.step !== "link_sent" && <p className="text-xs text-emerald-300/90">{auth.notice}</p>}
    </div>
  );
}
