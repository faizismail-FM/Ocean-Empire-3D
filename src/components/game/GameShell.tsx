"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, BookOpen, BookOpenText, Building2, Coins, Globe2, Handshake, Hourglass, Landmark, ListChecks, Menu, Pause, Play, Save, ScrollText, Settings, Ship, Store, Target, Waves, X } from "lucide-react";
import { formatClock, formatGameDate } from "@/engine/calendar";
import { TIME_SCALES, timeScaleHint, timeScaleLabel } from "@/lib/time-scale";
import { cn, formatMoney } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, LinkButton } from "@/components/ui";
import { EmblemIcon } from "./NewGameWizard";
import { SimulationRunner } from "./SimulationRunner";
import { Toasts } from "./Toasts";
import { VoyageReportModal } from "./VoyageReportModal";
import { CampaignEndModal } from "./CampaignEndModal";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Globe2;
  feature?: "diplomacy" | "technology" | "territory";
}

const NAV: NavItem[] = [
  { href: "/play/world", label: "World", icon: Globe2 },
  { href: "/play/sail", label: "Sail", icon: Waves },
  { href: "/play/empire", label: "Empire", icon: Landmark },
  { href: "/play/fleet", label: "Fleet", icon: Ship },
  { href: "/play/trade", label: "Trade", icon: Store },
  { href: "/play/ports", label: "Ports", icon: Building2 },
  { href: "/play/technology", label: "Technology", icon: ScrollText, feature: "technology" },
  { href: "/play/diplomacy", label: "Diplomacy", icon: Handshake, feature: "diplomacy" },
  { href: "/play/history", label: "History", icon: BookOpen },
  { href: "/play/missions", label: "Missions", icon: Target },
  { href: "/play/settings", label: "Settings", icon: Settings },
];

/** Layout for every in-game screen: top status bar, side navigation, runner, overlays. */
export function GameShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const state = useGameStore((s) => s.state);
  const catalog = useGameStore((s) => s.catalog);
  const continueLatest = useGameStore((s) => s.continueLatest);
  const [restorePending, setRestorePending] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const isSail = pathname === "/play/sail";
  const restoring = !state && restorePending;

  // On a hard reload the store is empty: try to restore the latest save transparently.
  useEffect(() => {
    if (state) return;
    let cancelled = false;
    void continueLatest().finally(() => {
      if (!cancelled) setRestorePending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [state, continueLatest]);

  if (!state || !catalog) {
    return (
      <main className="menu-sea flex min-h-screen items-center justify-center p-6">
        <div className="panel max-w-md p-8 text-center">
          {restoring ? (
            <>
              <Hourglass className="mx-auto animate-pulse text-cyan-300" />
              <p className="mt-3 text-foam/70">Restoring your latest voyage…</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl">No game in progress</h1>
              <p className="mt-2 text-foam/65">Start a new game or continue a saved one from the main menu.</p>
              <div className="mt-5 flex justify-center gap-2">
                <LinkButton href="/new">New Game</LinkButton>
                <LinkButton href="/" variant="secondary">
                  Main menu
                </LinkButton>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  const features = catalog.scenario.features;
  const nav = NAV.filter((n) => !n.feature || features[n.feature]);

  return (
    <div className={cn("flex min-h-screen flex-col", isSail && "h-screen overflow-hidden")}>
      <SimulationRunner />
      {!isSail && <TopBar onMenu={() => setNavOpen((v) => !v)} />}
      <div className={cn("flex flex-1", isSail ? "min-h-0" : "")}>
        {!isSail && (
          <aside className={cn("fixed inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-white/5 bg-navy-950/95 pt-16 transition-transform md:static md:translate-x-0 md:bg-transparent md:pt-0", navOpen ? "translate-x-0" : "-translate-x-full")}>
            <nav className="flex flex-col gap-0.5 p-3" aria-label="Game navigation">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-cyan-400/15 text-cyan-300" : "text-foam/70 hover:bg-white/5 hover:text-foam")}>
                    <item.icon size={16} /> {item.label}
                  </Link>
                );
              })}
              <div className="mt-3 border-t border-white/5 pt-3">
                <Link href="/guide" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foam/60 hover:bg-white/5 hover:text-foam">
                  <BookOpenText size={16} /> How to play
                </Link>
                <Link href="/encyclopedia" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foam/60 hover:bg-white/5 hover:text-foam">
                  <BookOpen size={16} /> Encyclopedia
                </Link>
                <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foam/60 hover:bg-white/5 hover:text-foam">
                  <Menu size={16} /> Main menu
                </Link>
              </div>
            </nav>
          </aside>
        )}
        {navOpen && !isSail && <div className="fixed inset-0 z-30 bg-navy-950/60 md:hidden" onClick={() => setNavOpen(false)} />}
        <main className={cn("min-w-0 flex-1", isSail ? "relative" : "px-4 pb-10 pt-4 md:px-6")}>{children}</main>
      </div>
      <Toasts />
      <VoyageReportModal />
      <CampaignEndModal />
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const togglePaused = useGameStore((s) => s.togglePaused);
  const setTimeScale = useGameStore((s) => s.setTimeScale);
  const saveGame = useGameStore((s) => s.saveGame);
  const markRead = useGameStore((s) => s.markNotificationsRead);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);
  const [saving, setSaving] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;
  const sailing = Object.values(state.ships).filter((s) => s.status !== "docked").length;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950/85 backdrop-blur">
      <div className="flex items-center gap-3 px-3 py-2 md:px-5">
        <button className="rounded-md p-1.5 text-foam/70 hover:bg-white/10 md:hidden" onClick={onMenu} aria-label="Toggle navigation">
          <Menu size={18} />
        </button>
        <Link href="/play/empire" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10" style={{ background: `${state.empire.emblem.color}22` }}>
            <EmblemIcon symbol={state.empire.emblem.symbol} color={state.empire.emblem.color} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm leading-tight text-foam">{state.empire.name}</span>
            <span className="block truncate text-xs leading-tight text-foam/50">{catalog.scenario.title}</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-1.5 rounded-lg bg-navy-800/80 px-3 py-1.5 font-mono text-sm text-gold-300 sm:flex" title="Treasury">
            <Coins size={14} />
            {formatMoney(state.treasury, catalog.scenario.currency)}
            {!catalog.scenario.currency.symbol && <span className="text-xs text-foam/50">{catalog.scenario.currency.code}</span>}
          </div>
          <div className="hidden flex-col items-end leading-tight lg:flex" title="Simulated date">
            <span className="text-sm text-foam">{formatGameDate(state.date)}</span>
            <span className="font-mono text-xs text-foam/50">{formatClock(state.sim_seconds)} · {sailing} at sea</span>
          </div>
          <div className="flex items-center rounded-lg bg-navy-800/80 p-0.5">
            <button onClick={togglePaused} className={cn("rounded-md p-1.5", state.paused ? "bg-gold-400/20 text-gold-300" : "text-cyan-300 hover:bg-white/10")} title={state.paused ? "Resume (Space)" : "Pause (Space)"} aria-label="Pause or resume">
              {state.paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            {TIME_SCALES.map((t) => (
              <button key={t} onClick={() => setTimeScale(t)} className={cn("hidden rounded-md px-1.5 py-1 font-mono text-xs sm:block", state.time_scale === t ? "bg-cyan-400/20 text-cyan-300" : "text-foam/55 hover:bg-white/10")} title={timeScaleHint(t)}>
                {timeScaleLabel(t)}
              </button>
            ))}
          </div>
          <div className="relative">
            <button onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markRead(); }} className="relative rounded-md p-1.5 text-foam/70 hover:bg-white/10" aria-label="Notifications">
              <Bell size={16} />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-400 px-1 text-[0.6rem] font-bold text-navy-950">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="panel absolute right-0 top-full mt-2 w-80 max-w-[90vw] p-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="label-caps">Notifications</span>
                  <button onClick={() => setNotifOpen(false)} className="text-foam/50 hover:text-foam"><X size={14} /></button>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {state.notifications.length === 0 && <p className="px-2 py-3 text-sm text-foam/50">Nothing yet.</p>}
                  {state.notifications.slice(0, 20).map((n) => (
                    <button key={n.id} onClick={() => { setNotifOpen(false); if (n.link) router.push(n.link); }} className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-white/5">
                      <div className="flex items-center gap-2 text-sm text-foam">
                        <Badge tone={n.kind === "event" ? "gold" : n.kind === "warning" ? "coral" : n.kind === "objective" || n.kind === "success" ? "green" : "neutral"}>{n.kind}</Badge>
                        <span className="truncate">{n.title}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-foam/60">{n.message}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={async () => { setSaving(true); await saveGame(); setSaving(false); }} disabled={saving} title={lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Save game"}>
            <Save size={14} /> <span className="hidden sm:inline">{saving ? "Saving…" : "Save"}</span>
          </Button>
          <Link href="/play/missions" className="hidden items-center gap-1 text-xs text-foam/60 hover:text-foam xl:flex" title="Missions completed">
            <ListChecks size={14} /> {Object.values(state.objectives).filter((o) => o.status === "completed").length}/{catalog.scenario.objectives.length} missions
          </Link>
        </div>
      </div>
    </header>
  );
}
