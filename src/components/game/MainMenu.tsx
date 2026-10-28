"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anchor, BookOpen, BookOpenText, Compass, Container, Play, RotateCcw, Settings, Trash2 } from "lucide-react";
import { ALL_SCENARIOS, getScenario } from "@/data";
import { formatGameDate } from "@/engine/calendar";
import type { SaveSummary } from "@/engine/state";
import { formatMoney } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import { AccountPanel } from "./AccountPanel";

const ENTRIES = [
  { href: "/new", label: "New Game", icon: Play, description: "Choose a scenario and found your empire or company." },
  { href: "/new?mode=historical", label: "Historical Campaigns", icon: Compass, description: "Siraf 850, Kilwa 1330, Venice 1423, Melaka 1460, the Carreira da Índia 1505 and the Dutch Company 1602, with sources." },
  { href: "/new?mode=modern", label: "Modern Shipping Empire", icon: Container, description: "Build a container line from a single feeder ship." },
  { href: "/guide", label: "How to Play", icon: BookOpenText, description: "The core loop, sailing controls, time, trade and ports." },
  { href: "/encyclopedia", label: "Civilization Encyclopedia", icon: BookOpen, description: "Ports, ships, goods, events and their evidence." },
  { href: "/play/settings", label: "Settings", icon: Settings, description: "Graphics quality, controls and saves." },
];

export function MainMenu() {
  const router = useRouter();
  const saves = useGameStore((s) => s.saves);
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  const loadGame = useGameStore((s) => s.loadGame);
  const deleteSave = useGameStore((s) => s.deleteSave);
  const current = useGameStore((s) => s.state);
  const [confirmDelete, setConfirmDelete] = useState<SaveSummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void refreshSaves();
  }, [refreshSaves]);

  const latest = saves[0];

  const onContinue = async (id: string) => {
    setBusy(id);
    const ok = await loadGame(id);
    setBusy(null);
    if (ok) router.push("/play/world");
  };

  return (
    <main className="menu-sea relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] opacity-70" aria-hidden>
        <Horizon />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 md:px-8">
        <header className="animate-fade-up">
          <div className="flex items-center gap-3 text-cyan-300/80">
            <Anchor size={22} />
            <span className="label-caps">Maritime simulator · empire builder · history</span>
          </div>
          <h1 className="text-glow mt-3 text-5xl text-foam md:text-7xl">Ocean Empire 3D</h1>
          <p className="mt-3 max-w-2xl text-base text-foam/70 md:text-lg">
            Sail a living ocean, carry cargo between real ports, and grow a trading house across the monsoon seas of 850 CE, the Swahili gold coast of 1330, the galley convoys of Venice in 1423, the Straits of 1460, the Cape route of 1505, or the container lanes of today.
          </p>
        </header>

        <div className="mt-10 grid flex-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <nav className="animate-fade-up grid gap-2 self-start sm:grid-cols-2" aria-label="Main menu">
            {ENTRIES.map((e) => (
              <Link key={e.href + e.label} href={e.href} className="panel group flex items-start gap-3 p-4 transition-colors hover:border-cyan-300/40">
                <span className="mt-0.5 rounded-lg bg-cyan-400/10 p-2 text-cyan-300 group-hover:bg-cyan-400/20">
                  <e.icon size={18} />
                </span>
                <span>
                  <span className="block text-base text-foam">{e.label}</span>
                  <span className="block text-xs text-foam/55">{e.description}</span>
                </span>
              </Link>
            ))}
          </nav>

          <aside className="animate-fade-up panel self-start p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Continue Game</h2>
              <Badge tone="cyan">{saves.length} save{saves.length === 1 ? "" : "s"}</Badge>
            </div>
            {latest ? (
              <div className="mt-4">
                <SaveCard save={latest} highlight onContinue={() => onContinue(latest.id)} onDelete={() => setConfirmDelete(latest)} busy={busy === latest.id} />
                {saves.length > 1 && (
                  <div className="mt-3 space-y-2">
                    <div className="label-caps">Other saves</div>
                    {saves.slice(1).map((s) => (
                      <SaveCard key={s.id} save={s} onContinue={() => onContinue(s.id)} onDelete={() => setConfirmDelete(s)} busy={busy === s.id} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-foam/60">No saved games yet. Start a new game to begin; progress is saved in this browser automatically.</p>
            )}
            <div className="mt-4 border-t border-white/10 pt-3">
              <AccountPanel compact />
            </div>
            {current && (
              <div className="mt-4 border-t border-white/10 pt-3 text-xs text-foam/60">
                A game is open: <span className="text-foam">{current.empire.name}</span>.{" "}
                <Link href="/play/world" className="text-cyan-300 hover:underline">
                  Return to it
                </Link>
                .
              </div>
            )}
          </aside>
        </div>

        <footer className="mt-10 grid gap-4 text-xs text-foam/45 md:grid-cols-3">
          {ALL_SCENARIOS.map((s) => (
            <div key={s.id} className="panel-soft p-3">
              <div className="text-foam/80">{s.title}</div>
              <div>{s.subtitle}</div>
            </div>
          ))}
        </footer>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteSave(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete this save?"
        message={<>The save for <strong>{confirmDelete?.empire_name}</strong> will be removed permanently. This cannot be undone.</>}
        confirmLabel="Delete"
        danger
      />
    </main>
  );
}

function SaveCard({ save, highlight, onContinue, onDelete, busy }: { save: SaveSummary; highlight?: boolean; onContinue: () => void; onDelete: () => void; busy: boolean }) {
  const scenario = getScenario(save.scenario_id);
  const currency = scenario?.currency ?? { symbol: "", code: "" };
  return (
    <div className={highlight ? "rounded-xl border border-cyan-300/30 bg-cyan-400/5 p-4" : "panel-soft p-3"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={highlight ? "text-lg text-foam" : "text-sm text-foam"}>{save.empire_name}</div>
          <div className="text-xs text-foam/60">
            {scenario?.title ?? save.scenario_id} · {formatGameDate(save.date)}
          </div>
        </div>
        <Badge tone={save.mode === "modern" ? "cyan" : "gold"}>{save.mode}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-foam/75">
        <span>Treasury {formatMoney(save.treasury, currency)}</span>
        <span>{save.ships} ship{save.ships === 1 ? "" : "s"}</span>
        <span>{save.contracts_completed} deliveries</span>
        {save.campaign_status !== "active" && <span className="text-gold-300">{save.campaign_status.replace("_", " ")}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size={highlight ? "md" : "sm"} onClick={onContinue} disabled={busy}>
          {busy ? <RotateCcw className="animate-spin" size={14} /> : <Play size={14} />}
          Continue
        </Button>
        <Button size={highlight ? "md" : "sm"} variant="ghost" onClick={onDelete} aria-label="Delete save">
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

function Horizon() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f7d794" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f4845f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="900" cy="150" rx="260" ry="120" fill="url(#glow)" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M0 ${200 + i * 14} Q 300 ${190 + i * 14} 600 ${200 + i * 14} T 1200 ${200 + i * 14}`} stroke="rgba(103,232,249,0.08)" fill="none" strokeWidth="1" />
      ))}
    </svg>
  );
}
