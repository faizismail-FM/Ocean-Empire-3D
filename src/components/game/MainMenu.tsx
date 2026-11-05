"use client";

import { SoundToggle } from "./SoundToggle";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Anchor, ArrowRight, BookOpen, BookOpenText, ChevronLeft, ChevronRight, Compass, Container, Minus, MousePointer2, Play, Plus, RotateCcw, Settings, Trash2, Wind } from "lucide-react";
import { ALL_SCENARIOS, getCatalog, getScenario } from "@/data";
import { formatGameDate } from "@/engine/calendar";
import type { SaveSummary } from "@/engine/state";
import { MANUAL_HOLD_MS, clampThrottle, menuHelm, menuReadout, showcaseFor } from "@/lib/menu-demo";
import { cn, formatMoney } from "@/lib/utils";
import { useWebGL } from "@/lib/webgl";
import { useGameStore } from "@/store/game-store";
import { useMenuStore } from "@/store/menu-store";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import { AccountPanel } from "./AccountPanel";

// Three.js must never run during server rendering; the sea loads after hydration.
const MenuScene = dynamic(() => import("@/components/three/MenuScene").then((m) => m.MenuScene), { ssr: false });

const ENTRIES = [
  { href: "/new", label: "New Game", icon: Play, description: "Choose a scenario and found your empire or company." },
  { href: "/new?mode=historical", label: "Historical Campaigns", icon: Compass, description: "Siraf 850, Srivijaya 992, Kilwa 1330, the Ming fleets 1405, Venice 1423, Melaka 1460, the Carreira da Índia 1505, the Dutch Company 1602 and the East India Company 1757, with sources." },
  { href: "/new?mode=modern", label: "Modern Shipping Empire", icon: Container, description: "Build a container line from a single feeder ship." },
  { href: "/guide", label: "How to Play", icon: BookOpenText, description: "The core loop, sailing controls, time, trade and ports." },
  { href: "/encyclopedia", label: "Civilization Encyclopedia", icon: BookOpen, description: "Ports, ships, goods, events and their evidence." },
  { href: "/play/settings", label: "Settings", icon: Settings, description: "Graphics quality, controls and saves." },
];

const DEFAULT_SHOWCASE = "modern_shipping_2024";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function readReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}
function subscribeReducedMotion(callback: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function MainMenu() {
  const router = useRouter();
  const saves = useGameStore((s) => s.saves);
  const refreshSaves = useGameStore((s) => s.refreshSaves);
  const loadGame = useGameStore((s) => s.loadGame);
  const deleteSave = useGameStore((s) => s.deleteSave);
  const current = useGameStore((s) => s.state);
  const showcaseId = useMenuStore((s) => s.showcaseId);
  const setShowcase = useMenuStore((s) => s.setShowcase);
  const webgl = useWebGL();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const [confirmDelete, setConfirmDelete] = useState<SaveSummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void refreshSaves();
  }, [refreshSaves]);


  const latest = saves[0];
  // The sea shows the vessel of the player's latest save, or the container line for a first visit.
  useEffect(() => {
    if (showcaseId) return;
    setShowcase(latest && getScenario(latest.scenario_id) ? latest.scenario_id : DEFAULT_SHOWCASE);
  }, [showcaseId, latest, setShowcase]);
  const activeId = showcaseId ?? DEFAULT_SHOWCASE;
  const scenario = getScenario(activeId) ?? ALL_SCENARIOS[0]!;
  const showcase = useMemo(() => showcaseFor(scenario, getCatalog(scenario.id)), [scenario]);

  const onContinue = async (id: string) => {
    setBusy(id);
    const ok = await loadGame(id);
    setBusy(null);
    if (ok) router.push("/play/world");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className={cn("fixed inset-0", webgl ? "bg-[#06192e]" : "menu-sea")} aria-hidden>
        {webgl ? (
          <MenuScene scenarioId={activeId} reducedMotion={reducedMotion} />
        ) : (
          <div className="absolute inset-x-0 top-0 h-[55vh] opacity-70">
            <Horizon />
          </div>
        )}
      </div>
      {/* Legibility: darken the edges and the lower band where the panels sit, leave the middle of the sea clear. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_700px_at_50%_45%,rgba(4,11,22,0)_0%,rgba(4,11,22,0.4)_70%,rgba(4,11,22,0.78)_100%)]" aria-hidden />

      <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:px-8">
        <header className="animate-fade-up">
          <div className="flex items-center gap-3 text-cyan-300/80">
            <SoundToggle className="pointer-events-auto absolute right-4 top-4 md:right-8" label />
            <Anchor size={22} />
            <span className="label-caps">Maritime simulator · empire builder · history</span>
          </div>
          <h1 className="text-glow mt-3 text-5xl text-foam md:text-7xl">Ocean Empire 3D</h1>
          <p className="mt-3 max-w-xl text-base text-foam/80 md:text-lg [text-shadow:0_1px_12px_rgba(4,11,22,0.9)]">
            Sail a living ocean, carry cargo between real ports, and grow a trading house from the monsoon seas of 850 CE to the container lanes of today.
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <nav className="pointer-events-auto animate-fade-up grid gap-2 self-start sm:grid-cols-2" aria-label="Main menu">
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

          <aside className="pointer-events-auto animate-fade-up panel self-start p-5">
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

        <div className="flex-1" />

        {/* The showcase: which era is on the water, and the helm. */}
        <section className="pointer-events-auto animate-fade-up mt-8" aria-label="Live sea">
          <div className="hud-glass p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="label-caps">On the water</span>
                {webgl && <Badge tone="green">Live</Badge>}
                {webgl === false && <Badge tone="neutral">3D needs WebGL</Badge>}
              </div>
              <div className="min-w-0 flex-1 text-sm text-foam/80">
                <span className="text-foam">{showcase.cls.name_or_class}</span>
                <span className="text-foam/50"> · </span>
                {scenario.subtitle}
              </div>
              <Link href={`/new?scenario=${scenario.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-cyan-400/90 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-cyan-300">
                Begin this {scenario.mode === "modern" ? "company" : "campaign"} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Choose an era">
              {ERA_CHIPS.map((s) => {
                const active = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setShowcase(s.id)}
                    className={cn("shrink-0 rounded-full border px-3 py-1 text-xs transition-colors", active ? "border-cyan-300 bg-cyan-400/15 text-cyan-300" : "border-white/10 text-foam/70 hover:border-white/30 hover:text-foam")}
                  >
                    {eraLabel(s.id, s.title)}
                  </button>
                );
              })}
            </div>
            {webgl && <HelmStrip propulsion={showcase.cls.propulsion} reducedMotion={reducedMotion} />}
          </div>
        </section>
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

const CHIP_NAMES: Record<string, string> = {
  modern_shipping_2024: "Container line",
  siraf_850: "Siraf",
  srivijaya_992: "Srivijaya",
  kilwa_1330: "Kilwa",
  ming_1405: "Ming fleets",
  venice_1423: "Venice",
  melaka_1460: "Melaka",
  portugal_1505: "Carreira da Índia",
  dutch_1602: "Dutch Company",
  britain_1757: "East India Company",
};

/** Short chip labels: the place or power and the start year, oldest first. */
function eraLabel(id: string, title: string): string {
  const year = id.match(/_(\d{3,4})$/)?.[1];
  const short = CHIP_NAMES[id] ?? title;
  return year ? `${short} · ${year}` : short;
}

const ERA_CHIPS = [...ALL_SCENARIOS].sort((a, b) => a.start_date.localeCompare(b.start_date));

/** Live readout plus helm buttons; keys steer too while nothing else has focus. */
function HelmStrip({ propulsion, reducedMotion }: { propulsion: "sail" | "engine"; reducedMotion: boolean }) {
  const [readout, setReadout] = useState({ ...menuReadout });

  useEffect(() => {
    const id = window.setInterval(() => setReadout({ ...menuReadout }), 125);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a") steer(-1);
      else if (k === "d") steer(1);
      else if (k === "w") trim(0.1);
      else if (k === "s") trim(-0.1);
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "d") steer(0);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const hour = Math.floor(readout.hour);
  const minute = Math.floor((readout.hour - hour) * 60);
  const label = propulsion === "sail" ? "Sail" : "Throttle";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-3 font-mono text-xs text-foam/75">
      <span>
        <span className="text-foam/45">Speed </span>
        {readout.speedKnots.toFixed(1)} kn
      </span>
      <span>
        <span className="text-foam/45">Heading </span>
        {Math.round(readout.heading).toString().padStart(3, "0")}°
      </span>
      <span className="inline-flex items-center gap-1">
        <Wind size={12} className="text-cyan-300/80" />
        <span className="text-foam/45">from </span>
        {Math.round(readout.windFrom)}° · {Math.round(readout.windKnots)} kn
      </span>
      <span>
        <span className="text-foam/45">Time </span>
        {hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")}
      </span>
      <span className={cn(readout.manual ? "text-gold-300" : "text-cyan-300/80")}>{readout.manual ? "You have the helm" : "Autopilot"}</span>
      <span className="ml-auto flex items-center gap-1">
        <HelmButton label="Steer to port (A)" onPress={() => steer(-1)} onRelease={() => steer(0)}>
          <ChevronLeft size={14} />
        </HelmButton>
        <HelmButton label="Steer to starboard (D)" onPress={() => steer(1)} onRelease={() => steer(0)}>
          <ChevronRight size={14} />
        </HelmButton>
        <button onClick={() => trim(-0.1)} className="rounded-md border border-white/10 p-1.5 hover:bg-white/10" aria-label={`Less ${label.toLowerCase()} (S)`} title={`Less ${label.toLowerCase()} (S)`}>
          <Minus size={14} />
        </button>
        <button onClick={() => trim(0.1)} className="rounded-md border border-white/10 p-1.5 hover:bg-white/10" aria-label={`More ${label.toLowerCase()} (W)`} title={`More ${label.toLowerCase()} (W)`}>
          <Plus size={14} />
        </button>
      </span>
      <span className="hidden items-center gap-1 text-foam/45 md:inline-flex">
        <MousePointer2 size={12} /> Drag the sea to look around, scroll to zoom{reducedMotion ? "" : "; the camera drifts on its own when idle"}.
      </span>
    </div>
  );
}

function HelmButton({ label, onPress, onRelease, children }: { label: string; onPress: () => void; onRelease: () => void; children: React.ReactNode }) {
  return (
    <button
      onPointerDown={onPress}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
      className="rounded-md border border-white/10 p-1.5 hover:bg-white/10 active:bg-cyan-400/20"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function steer(rudder: number) {
  menuHelm.rudder = rudder;
  menuHelm.manualUntil = performance.now() + MANUAL_HOLD_MS;
}

function trim(delta: number) {
  menuHelm.throttle = clampThrottle(menuHelm.throttle + delta);
  menuHelm.manualUntil = performance.now() + MANUAL_HOLD_MS;
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

/** Static horizon for browsers without WebGL. */
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
