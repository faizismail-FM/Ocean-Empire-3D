"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Anchor, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Compass as CompassIcon, Gauge, Globe2, HelpCircle, Minus, Pause, Play, Plus, RotateCcw, Save, Ship, Wind, X, Zap, ZapOff } from "lucide-react";
import type { VesselClass } from "@/data/schemas";
import { cargoCapacity, cargoUsed } from "@/engine/contracts";
import { formatClock, formatDuration, formatGameDate } from "@/engine/calendar";
import { compassLabel, distanceNm, formatCoordinate, headingDifference, initialBearing } from "@/engine/geo";
import { computeModifiers } from "@/engine/modifiers";
import { remainingDistanceNm } from "@/engine/routing";
import { estimateVoyageSeconds } from "@/engine/ship";
import type { GameState, ShipState } from "@/engine/state";
import { windForDate } from "@/engine/wind";
import { TIME_SCALES, timeScaleHint, timeScaleLabel } from "@/lib/time-scale";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { viewState } from "@/components/three/scene-state";
import { Badge, Button } from "@/components/ui";
import { GuideOverlay } from "@/components/game/Guide";

/** Subscribe to the store at a modest rate so the HUD does not re-render 60 times a second. */
function useThrottledState(intervalMs = 120): GameState | null {
  const [snapshot, setSnapshot] = useState<GameState | null>(() => useGameStore.getState().state);
  useEffect(() => {
    let last = 0;
    let pending: GameState | null = null;
    let timer: number | null = null;
    const flush = () => {
      last = performance.now();
      setSnapshot(pending);
      timer = null;
    };
    const unsub = useGameStore.subscribe((s) => {
      pending = s.state;
      const elapsed = performance.now() - last;
      if (elapsed >= intervalMs) flush();
      else if (timer === null) timer = window.setTimeout(flush, intervalMs - elapsed);
    });
    return () => {
      unsub();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [intervalMs]);
  return snapshot;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function SailingHUD() {
  const router = useRouter();
  const state = useThrottledState();
  const catalog = useGameStore((s) => s.catalog);
  const setControls = useGameStore((s) => s.setControls);
  const togglePaused = useGameStore((s) => s.togglePaused);
  const setTimeScale = useGameStore((s) => s.setTimeScale);
  const setDestination = useGameStore((s) => s.setDestination);
  const depart = useGameStore((s) => s.depart);
  const saveGame = useGameStore((s) => s.saveGame);
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  const dismissTutorial = useGameStore((s) => s.dismissTutorial);
  const pushToast = useGameStore((s) => s.pushToast);
  const camera = useSettingsStore((s) => s.camera);
  const cycleCamera = useSettingsStore((s) => s.cycleCamera);
  const showHints = useSettingsStore((s) => s.showTutorialHints);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);
  const rudderHeld = useRef<"port" | "starboard" | null>(null);

  const ship: ShipState | undefined = state?.active_ship_id ? state.ships[state.active_ship_id] : undefined;
  const cls: VesselClass | undefined = ship ? catalog?.ships.find((c) => c.id === ship.class_id) : undefined;

  const manual = useCallback(
    (controls: Partial<Pick<ShipState, "throttle" | "rudder" | "autopilot">>) => {
      const st = useGameStore.getState().state;
      const sh = st?.active_ship_id ? st.ships[st.active_ship_id] : undefined;
      if (!sh) return;
      if (sh.status === "docked") {
        pushToast({ kind: "info", title: "Docked", message: "Set a destination and depart before taking the helm." });
        return;
      }
      if (sh.autopilot && controls.autopilot === undefined) {
        setControls(sh.id, { ...controls, autopilot: false });
        pushToast({ kind: "info", title: "Manual control", message: "Autopilot disengaged. Press the autopilot button to resume." });
      } else {
        setControls(sh.id, controls);
      }
    },
    [setControls, pushToast],
  );

  // Keyboard controls (ignored while typing in form fields).
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const st = useGameStore.getState().state;
      const sh = st?.active_ship_id ? st.ships[st.active_ship_id] : undefined;
      switch (e.key.toLowerCase()) {
        case "w":
          e.preventDefault();
          if (sh) manual({ throttle: Math.min(1, Math.round((sh.throttle + 0.1) * 10) / 10) });
          break;
        case "s":
          e.preventDefault();
          if (sh) manual({ throttle: Math.max(0, Math.round((sh.throttle - 0.1) * 10) / 10) });
          break;
        case "a":
          e.preventDefault();
          if (rudderHeld.current !== "port") {
            rudderHeld.current = "port";
            manual({ rudder: -1 });
          }
          break;
        case "d":
          e.preventDefault();
          if (rudderHeld.current !== "starboard") {
            rudderHeld.current = "starboard";
            manual({ rudder: 1 });
          }
          break;
        case " ":
          e.preventDefault();
          togglePaused();
          break;
        case "c":
          cycleCamera();
          break;
        case "+":
        case "=":
          viewState.zoom(-1);
          break;
        case "-":
        case "_":
          viewState.zoom(1);
          break;
        case "r":
          viewState.reset();
          break;
        case "?":
        case "h":
          setGuideOpen((v) => !v);
          break;
        case "escape":
          setMenuOpen((v) => !v);
          break;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const k = e.key.toLowerCase();
      if ((k === "a" && rudderHeld.current === "port") || (k === "d" && rudderHeld.current === "starboard")) {
        rudderHeld.current = null;
        const st = useGameStore.getState().state;
        const sh = st?.active_ship_id ? st.ships[st.active_ship_id] : undefined;
        if (sh && !sh.autopilot) setControls(sh.id, { rudder: 0 });
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [manual, togglePaused, cycleCamera, setControls]);

  if (!state || !catalog || !ship || !cls) return null;
  const mods = computeModifiers(catalog, state);
  const destination = ship.route[ship.route.length - 1];
  const destPort = destination?.port_id ? catalog.portMap.get(destination.port_id) : null;
  const nextWp = ship.route[Math.min(ship.waypoint_index, ship.route.length - 1)];
  const remaining = ship.route.length > 0 ? remainingDistanceNm(ship.position, ship.route, Math.min(ship.waypoint_index, ship.route.length - 1)) : 0;
  const eta = remaining > 0 && ship.speed_knots > 0.5 ? (remaining / ship.speed_knots) * 3600 : remaining > 0 ? estimateVoyageSeconds(cls, remaining, mods) : null;
  const total = ship.voyage?.distance_total_nm ?? 0;
  const progress = total > 0 ? Math.min(1, (ship.voyage?.distance_sailed_nm ?? 0) / total) : 0;
  const bearingToDest = destination ? initialBearing(ship.position, destination) : null;
  const capacity = cargoCapacity(cls, mods.cargo_multiplier);
  const used = cargoUsed(ship, catalog);
  const here = ship.docked_port_id ? catalog.portMap.get(ship.docked_port_id) : null;
  const wind = catalog.scenario.features.wind ? windForDate(catalog.scenario.wind, state.date.month, state.date.day) : null;
  const relWind = wind ? headingDifference(ship.heading, wind.from) : 0;
  const inIrons = wind && cls.propulsion === "sail" && Math.abs(relWind) < (cls.min_sailing_angle_deg ?? 60);
  const isSail = cls.propulsion === "sail";
  const enduranceLabel = catalog.scenario.features.fuel ? "Fuel" : "Provisions";
  const enduranceUnit = catalog.scenario.features.fuel ? "t" : "d";
  const openPorts = catalog.ports.filter((p) => {
    const ps = state.ports[p.id];
    return ps && ps.access !== "closed" && ps.access !== "restricted" && !(ship.status === "docked" && ship.docked_port_id === p.id);
  });
  const hint = tutorialHint(state, ship, catalog.scenario.mode);

  const speedKmh = ship.speed_knots * 1.852;
  const statusLabel = ship.status === "docked" ? `Docked · ${here?.name ?? ""}` : ship.status === "drifting" ? "Drifting" : "Under way";

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-foam">
      {/* Top-left: ship card (collapsible on small screens) */}
      <div className="hud-glass pointer-events-auto absolute left-3 right-3 top-3 p-3 text-sm md:right-auto md:w-80">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold leading-tight">{ship.name}</div>
            <div className="truncate text-xs text-foam/60">{cls.name_or_class}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-md px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider", ship.status === "docked" ? "bg-white/10 text-foam/70" : ship.status === "drifting" ? "bg-coral-400/20 text-coral-400" : "bg-emerald-400/15 text-emerald-300")}>{statusLabel}</span>
            <button onClick={() => setCardExpanded((v) => !v)} className="rounded-md p-1 text-foam/50 hover:bg-white/10 hover:text-foam md:hidden" aria-label={cardExpanded ? "Collapse ship details" : "Expand ship details"}>
              {cardExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs md:hidden">
          <MiniStat label="Speed" value={`${ship.speed_knots.toFixed(1)} kn`} />
          <MiniStat label="Heading" value={`${Math.round(ship.heading).toString().padStart(3, "0")}°`} />
          <MiniStat label="ETA" value={eta ? formatDuration(eta) : "—"} />
        </div>
        <div className={cn("mt-2 grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs md:grid", cardExpanded ? "grid" : "hidden")}>
          <HudRow label="Speed" value={`${ship.speed_knots.toFixed(1)} kn · ${speedKmh.toFixed(0)} km/h`} wide />
          <HudRow label="Heading" value={`${Math.round(ship.heading).toString().padStart(3, "0")}° ${compassLabel(ship.heading)}`} />
          <HudRow label="Position" value={formatCoordinate(ship.position)} />
          <HudRow label="Destination" value={destPort?.name ?? "—"} wide />
          <HudRow label="Remaining" value={remaining > 0 ? `${formatNumber(remaining)} nm` : "—"} />
          <HudRow label="ETA" value={eta ? formatDuration(eta) : "—"} />
          <HudRow label="Next waypoint" value={nextWp ? `${nextWp.label ?? `${Math.min(ship.waypoint_index, ship.route.length - 1) + 1} of ${ship.route.length - 1}`}` : "—"} wide />
          <HudRow label="Cargo" value={`${formatNumber(used)}/${formatNumber(capacity)} ${cls.cargo_unit}`} />
          <HudRow label={enduranceLabel} value={`${formatNumber(ship.endurance, 0)}/${formatNumber(cls.endurance_capacity)} ${enduranceUnit}`} warn={ship.endurance / cls.endurance_capacity < 0.2} />
          <HudRow label="Autopilot" value={ship.autopilot ? "engaged" : "manual"} />
          <HudRow label="Condition" value={`${Math.round(ship.condition)}%`} warn={ship.condition < 40} />
        </div>
        {total > 0 && (
          <div className={cn("mt-2", !cardExpanded && "hidden md:block")}>
            <div className="flex justify-between text-[0.65rem] text-foam/60"><span>Voyage progress</span><span>{Math.round(progress * 100)}%</span></div>
            <div className="mt-0.5 h-1 w-full rounded bg-white/10"><div className="h-full rounded bg-cyan-400" style={{ width: `${progress * 100}%` }} /></div>
          </div>
        )}
      </div>

      {/* Top-center: compass tape */}
      <div className="pointer-events-none absolute left-1/2 top-3 hidden -translate-x-1/2 lg:block">
        <CompassTape heading={ship.heading} bearing={bearingToDest} windFrom={wind?.from ?? null} />
      </div>

      {/* Top-right: clock, time scale, environment (desktop) */}
      <div className="hud-glass pointer-events-auto absolute right-3 top-3 hidden w-64 p-3 text-xs md:block">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm">{formatGameDate(state.date)}</div>
            <div className="font-mono text-foam/60">{formatClock(state.sim_seconds)}</div>
          </div>
          <button onClick={togglePaused} className={cn("rounded-md p-2", state.paused ? "bg-gold-400/20 text-gold-300" : "bg-cyan-400/15 text-cyan-300")} title={state.paused ? "Resume (Space)" : "Pause (Space)"} aria-label={state.paused ? "Resume" : "Pause"}>
            {state.paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
        <TimeScaleButtons value={state.time_scale} onChange={setTimeScale} className="mt-2" />
        <div className="mt-1 text-[0.68rem] text-foam/55">{state.paused ? "Paused" : timeScaleHint(state.time_scale)}</div>
        {wind && (
          <div className={cn("mt-2 flex items-center gap-2 rounded-md px-2 py-1", inIrons ? "bg-coral-400/15 text-coral-400" : "bg-white/5 text-foam/80")}>
            <Wind size={14} style={{ transform: `rotate(${wind.from + 180}deg)` }} />
            <span>
              Wind from {compassLabel(wind.from)} {Math.round(wind.speed_knots)} kn{inIrons ? " · in irons, bear away" : ""}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-foam/70">
          <span className="flex items-center gap-1 capitalize"><Camera size={12} /> {camera} camera</span>
          <span className="font-mono text-gold-300">{formatMoney(state.treasury, catalog.scenario.currency)}</span>
        </div>
      </div>

      {/* Tutorial hint */}
      {showHints && hint && !state.tutorial.dismissed && (
        <div className="hud-glass pointer-events-auto absolute bottom-[12.5rem] left-3 right-3 border-gold-400/40 p-3 text-xs md:bottom-auto md:right-auto md:top-[22.5rem] md:w-80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="label-caps text-gold-300">Next step</div>
              <p className="mt-1 text-foam/85">{hint.text}</p>
              {hint.link && (
                <Link href={hint.link.href} className="mt-2 inline-block text-cyan-300 hover:underline">
                  {hint.link.label} →
                </Link>
              )}
            </div>
            <button onClick={dismissTutorial} className="text-foam/40 hover:text-foam" aria-label="Hide hints"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Bottom-center controls */}
      <div className="hud-glass pointer-events-auto absolute bottom-3 left-1/2 w-[min(96vw,900px)] -translate-x-1/2 p-3">
        {/* Mobile-only clock and time scale */}
        <div className="mb-2 flex items-center gap-2 text-xs md:hidden">
          <button onClick={togglePaused} className={cn("rounded-md p-1.5", state.paused ? "bg-gold-400/20 text-gold-300" : "bg-cyan-400/15 text-cyan-300")} aria-label={state.paused ? "Resume" : "Pause"}>
            {state.paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <TimeScaleButtons value={state.time_scale} onChange={setTimeScale} className="flex-1" />
          <span className="font-mono text-foam/60">{formatClock(state.sim_seconds)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-cyan-300" />
            <div className="w-36">
              <div className="flex justify-between text-[0.65rem] text-foam/60"><span>{isSail ? "Sail" : "Throttle"}</span><span className="font-mono">{Math.round(ship.throttle * 100)}%</span></div>
              <input type="range" min={0} max={100} step={5} value={Math.round(ship.throttle * 100)} onChange={(e) => manual({ throttle: Number(e.target.value) / 100 })} disabled={ship.status === "docked"} className="w-full" aria-label="Throttle" />
            </div>
            <div className="hidden text-[0.6rem] text-foam/40 lg:block">W / S</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className={cn("rounded-md border border-white/10 p-2 hover:bg-white/10", ship.rudder < -0.1 && "bg-cyan-400/20")}
              onPointerDown={() => manual({ rudder: -1 })}
              onPointerUp={() => !ship.autopilot && setControls(ship.id, { rudder: 0 })}
              onPointerLeave={() => !ship.autopilot && ship.rudder !== 0 && setControls(ship.id, { rudder: 0 })}
              disabled={ship.status === "docked"}
              aria-label="Steer to port (A)"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-16 text-center">
              <div className="text-[0.65rem] text-foam/60">Rudder</div>
              <div className="font-mono text-xs">{ship.rudder === 0 ? "midships" : `${Math.abs(Math.round(ship.rudder * 35))}° ${ship.rudder < 0 ? "port" : "stbd"}`}</div>
            </div>
            <button
              className={cn("rounded-md border border-white/10 p-2 hover:bg-white/10", ship.rudder > 0.1 && "bg-cyan-400/20")}
              onPointerDown={() => manual({ rudder: 1 })}
              onPointerUp={() => !ship.autopilot && setControls(ship.id, { rudder: 0 })}
              onPointerLeave={() => !ship.autopilot && ship.rudder !== 0 && setControls(ship.id, { rudder: 0 })}
              disabled={ship.status === "docked"}
              aria-label="Steer to starboard (D)"
            >
              <ChevronRight size={16} />
            </button>
            <div className="hidden text-[0.6rem] text-foam/40 lg:block">A / D</div>
          </div>

          <button
            onClick={() => ship.status !== "docked" && setControls(ship.id, { autopilot: !ship.autopilot, rudder: 0 })}
            disabled={ship.status === "docked" || ship.route.length < 2}
            className={cn("flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs", ship.autopilot ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300" : "border-white/10 hover:bg-white/10")}
            title={ship.route.length < 2 ? "Set a destination to enable autopilot" : ship.autopilot ? "Autopilot engaged: click to take the helm" : "Resume the plotted route"}
          >
            {ship.autopilot ? <Zap size={14} /> : <ZapOff size={14} />} Autopilot
          </button>

          <label className="flex items-center gap-1.5 text-xs text-foam/70">
            <CompassIcon size={14} />
            <select
              value={destination?.port_id ?? ""}
              onChange={(e) => {
                if (e.target.value) setDestination(ship.id, e.target.value);
              }}
              className="max-w-[11rem] py-1.5 text-xs"
              aria-label="Destination"
            >
              <option value="">Destination…</option>
              {openPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatNumber(distanceNm(ship.position, { lat: p.latitude, lon: p.longitude }))} nm)
                </option>
              ))}
            </select>
          </label>

          {ship.status === "docked" && ship.route.length >= 2 && (
            <Button size="sm" onClick={() => depart(ship.id)}>
              <Anchor size={14} /> Depart
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button onClick={cycleCamera} className="rounded-md border border-white/10 p-2 text-xs hover:bg-white/10" title="Cycle camera (C)" aria-label="Cycle camera"><Camera size={14} /></button>
            <button onClick={() => viewState.zoom(-1)} className="rounded-md border border-white/10 p-2 hover:bg-white/10" title="Zoom in (+)" aria-label="Zoom in"><Plus size={14} /></button>
            <button onClick={() => viewState.zoom(1)} className="rounded-md border border-white/10 p-2 hover:bg-white/10" title="Zoom out (−)" aria-label="Zoom out"><Minus size={14} /></button>
            <button onClick={() => viewState.reset()} className="hidden rounded-md border border-white/10 p-2 hover:bg-white/10 sm:block" title="Reset camera (R)" aria-label="Reset camera"><RotateCcw size={14} /></button>
            {Object.keys(state.ships).length > 1 && (
              <select value={ship.id} onChange={(e) => setActiveShip(e.target.value)} className="py-1.5 text-xs" aria-label="Active ship">
                {Object.values(state.ships).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button onClick={() => setGuideOpen(true)} className="rounded-md border border-white/10 p-2 hover:bg-white/10" title="How to play (?)" aria-label="How to play"><HelpCircle size={14} /></button>
            <button onClick={() => setMenuOpen(true)} className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10" title="Menu (Esc)">Menu</button>
          </div>
        </div>
      </div>

      {/* Escape menu */}
      {menuOpen && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="panel w-80 p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl">Game menu</h2>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setMenuOpen(false)}><Play size={14} /> Resume</Button>
              <Button variant="secondary" onClick={async () => { await saveGame(); setMenuOpen(false); }}><Save size={14} /> Save game</Button>
              <Button variant="secondary" onClick={() => router.push("/play/world")}><Globe2 size={14} /> World map</Button>
              <Button variant="secondary" onClick={() => router.push("/play/fleet")}><Ship size={14} /> Fleet</Button>
              <Button variant="secondary" onClick={() => { setMenuOpen(false); setGuideOpen(true); }}><HelpCircle size={14} /> How to play</Button>
              <Button variant="secondary" onClick={() => router.push("/play/settings")}>Settings</Button>
              <Button variant="ghost" onClick={() => router.push("/")}>Main menu</Button>
            </div>
            <p className="mt-3 text-[0.65rem] text-foam/45">The simulation keeps running while the menu is open unless paused.</p>
          </div>
        </div>
      )}

      <GuideOverlay open={guideOpen} onClose={() => setGuideOpen(false)} initial="sailing" />

      {/* Drifting / out of endurance banner */}
      {ship.status === "drifting" && (
        <div className="pointer-events-auto absolute left-1/2 top-24 -translate-x-1/2 rounded-lg border border-coral-400/50 bg-coral-400/15 px-4 py-2 text-sm text-coral-400">
          Out of fuel: the ship is drifting. <Badge tone="coral">no propulsion</Badge>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1">
      <div className="text-[0.6rem] uppercase tracking-wider text-foam/50">{label}</div>
      <div className="text-foam">{value}</div>
    </div>
  );
}

function TimeScaleButtons({ value, onChange, className }: { value: number; onChange: (scale: number) => void; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)} role="group" aria-label="Simulation speed">
      {TIME_SCALES.map((t) => (
        <button key={t} onClick={() => onChange(t)} title={timeScaleHint(t)} className={cn("flex-1 rounded px-1 py-1 font-mono text-xs", value === t ? "bg-cyan-400/25 text-cyan-300" : "bg-white/5 text-foam/60 hover:bg-white/10")}>
          {timeScaleLabel(t)}
        </button>
      ))}
    </div>
  );
}

function HudRow({ label, value, wide, warn }: { label: string; value: string; wide?: boolean; warn?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-2", wide && "col-span-2")}>
      <span className="text-foam/50">{label}</span>
      <span className={cn("truncate text-right", warn && "text-coral-400")}>{value}</span>
    </div>
  );
}

function CompassTape({ heading, bearing, windFrom }: { heading: number; bearing: number | null; windFrom: number | null }) {
  const width = 360;
  const span = 120; // degrees visible
  const pxPerDeg = width / span;
  const ticks: Array<{ deg: number; x: number; label?: string }> = [];
  for (let d = -span / 2; d <= span / 2; d += 10) {
    const deg = (Math.round(heading / 10) * 10 + d + 360) % 360;
    const x = width / 2 + (deg - heading + 540) % 360 * pxPerDeg - 180 * pxPerDeg;
    const label = deg % 90 === 0 ? compassLabel(deg) : deg % 30 === 0 ? `${deg}` : undefined;
    ticks.push({ deg, x, label });
  }
  const marker = (value: number | null) => (value === null ? null : width / 2 + (((value - heading + 540) % 360) - 180) * pxPerDeg);
  const bx = marker(bearing);
  const wx = marker(windFrom);
  return (
    <div className="hud-glass relative h-12 overflow-hidden px-2" style={{ width }}>
      {ticks.map((t) => (
        <div key={`${t.deg}-${t.x}`} className="absolute top-1 flex flex-col items-center" style={{ left: t.x }}>
          <div className={cn("w-px bg-foam/60", t.label ? "h-3" : "h-1.5")} />
          {t.label && <span className="mt-0.5 text-[0.6rem] text-foam/70">{t.label}</span>}
        </div>
      ))}
      {bx !== null && bx > 0 && bx < width && <div className="absolute bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-cyan-300" style={{ left: bx }} title="Bearing to destination" />}
      {wx !== null && wx > 0 && wx < width && <div className="absolute bottom-1 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[7px] border-x-transparent border-b-gold-300" style={{ left: wx }} title="Wind from" />}
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-cyan-300" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b bg-cyan-300 px-1 font-mono text-[0.65rem] font-bold text-navy-950">{Math.round(heading).toString().padStart(3, "0")}</div>
    </div>
  );
}

function tutorialHint(state: GameState, ship: ShipState, mode: "historical" | "modern"): { text: string; link?: { href: string; label: string } } | null {
  if (state.tutorial.completed) return null;
  const hasContractCargo = ship.cargo.some((c) => c.contract_id);
  if (ship.status === "docked") {
    if (!hasContractCargo) return { text: mode === "modern" ? "Accept a container contract bound for Singapore, then come back here." : "Accept a cargo contract at your home port, then return to the helm.", link: { href: "/play/trade", label: "Open contracts" } };
    if (ship.route.length < 2) return { text: "Cargo is aboard. Choose the contract's destination in the Destination list to plot a route." };
    return { text: "Route plotted. Press Depart. The autopilot follows the sea lanes; set 60× or faster to pass the voyage." };
  }
  if (ship.autopilot) return { text: "Under way. Press C to change camera, + and − to zoom, or take the helm with W/S and A/D. Arrival docks the ship and pays the contract. Press ? for the guide." };
  return { text: "Manual control. Steer toward the buoy or re-engage the autopilot to follow the planned route." };
}
