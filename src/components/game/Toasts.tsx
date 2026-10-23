"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, ScrollText, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle, event: ScrollText };
const TONES = {
  info: "border-cyan-400/30",
  success: "border-emerald-400/40",
  warning: "border-gold-400/40",
  error: "border-coral-400/50",
  event: "border-gold-400/50 bg-gold-400/5",
};

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      for (const t of useGameStore.getState().toasts) {
        if (now - t.created > (t.kind === "error" ? 6000 : 4500)) dismiss(t.id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [toasts.length, dismiss]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[92vw] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div key={t.id} className={cn("hud-glass pointer-events-auto flex animate-fade-up items-start gap-2.5 border p-3", TONES[t.kind])}>
            <Icon size={16} className={cn("mt-0.5 shrink-0", t.kind === "error" ? "text-coral-400" : t.kind === "success" ? "text-emerald-300" : t.kind === "warning" || t.kind === "event" ? "text-gold-300" : "text-cyan-300")} />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-foam">{t.title}</div>
              {t.message && <div className="mt-0.5 text-xs text-foam/65">{t.message}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-foam/40 hover:text-foam" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
