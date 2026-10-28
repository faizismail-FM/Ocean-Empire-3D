"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Anchor, ArrowLeft, ArrowRight, Compass, Container, Crown, Flag, Sailboat, Shell, Ship, Star, Sun, Waves } from "lucide-react";
import { ALL_SCENARIOS, getCatalog, getCivilization, type Scenario } from "@/data";
import type { GameMode } from "@/data/schemas";
import { dateFromIso, formatGameDate } from "@/engine/calendar";
import { cn, formatMoneyExact } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EvidenceBadge, KeyValue } from "@/components/ui";
import { SourceList } from "./SourceList";

const EMBLEMS = [
  { id: "anchor", icon: Anchor, label: "Anchor" },
  { id: "compass", icon: Compass, label: "Compass" },
  { id: "sailboat", icon: Sailboat, label: "Sail" },
  { id: "star", icon: Star, label: "Star" },
  { id: "sun", icon: Sun, label: "Sun" },
  { id: "waves", icon: Waves, label: "Waves" },
  { id: "shell", icon: Shell, label: "Shell" },
  { id: "crown", icon: Crown, label: "Crown" },
  { id: "flag", icon: Flag, label: "Flag" },
  { id: "container", icon: Container, label: "Container" },
];
const COLORS = ["#22d3ee", "#d4a62a", "#f4845f", "#34d399", "#a78bfa", "#f472b6", "#e6f4ff", "#1ea5de"];

export function EmblemIcon({ symbol, color, size = 18 }: { symbol: string; color?: string; size?: number }) {
  const Icon = EMBLEMS.find((e) => e.id === symbol)?.icon ?? Anchor;
  return <Icon size={size} style={color ? { color } : undefined} />;
}

export function NewGameWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const newGame = useGameStore((s) => s.newGame);
  const initialMode = params.get("mode") as GameMode | null;
  const [mode, setMode] = useState<GameMode | null>(initialMode === "historical" || initialMode === "modern" ? initialMode : null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [step, setStep] = useState<"mode" | "scenario" | "empire">(mode ? "scenario" : "mode");

  const scenarios = useMemo(() => ALL_SCENARIOS.filter((s) => !mode || s.mode === mode), [mode]);
  const scenario = scenarioId ? ALL_SCENARIOS.find((s) => s.id === scenarioId) ?? null : null;

  return (
    <main className="menu-sea min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-foam/60 hover:text-foam">
            <ArrowLeft size={16} /> Main menu
          </Link>
          <ol className="flex items-center gap-2 text-xs">
            {(["mode", "scenario", "empire"] as const).map((s, i) => (
              <li key={s} className={cn("flex items-center gap-2", step === s ? "text-cyan-300" : "text-foam/40")}>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[0.65rem]", step === s ? "border-cyan-300" : "border-foam/30")}>{i + 1}</span>
                <span className="capitalize">{s === "mode" ? "Game mode" : s}</span>
                {i < 2 && <span className="text-foam/20">—</span>}
              </li>
            ))}
          </ol>
        </div>

        {step === "mode" && (
          <section className="animate-fade-up mt-8">
            <h1 className="text-4xl">Choose a game mode</h1>
            <p className="mt-2 max-w-2xl text-foam/65">Both modes share the ocean, the ships and the ports. They differ in period, rules and what success means.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ModeCard
                icon={Compass}
                title="Historical Empire Campaign"
                text="Lead a trading house inside a documented maritime civilization. Sail with the monsoons, trade period goods, develop your home port, negotiate access, and watch documented events unfold."
                bullets={["Siraf 850, Kilwa 1330, Venice 1423, Melaka 1460, Lisbon 1505", "Five documented maritime civilizations", "Sailing vessels, wind, provisions, diplomacy"]}
                onClick={() => {
                  setMode("historical");
                  setStep("scenario");
                }}
              />
              <ModeCard
                icon={Container}
                title="Modern Shipping Empire"
                text="Found a container line with one feeder ship at Port Klang. Carry boxes to Singapore, pay fuel and terminal fees, buy bigger ships and open intercontinental services."
                bullets={["20 real container ports with accurate coordinates", "Fuel, port fees, maintenance, contracts", "No historical rules; company growth is the goal"]}
                onClick={() => {
                  setMode("modern");
                  setStep("scenario");
                }}
                accent="cyan"
              />
            </div>
          </section>
        )}

        {step === "scenario" && (
          <section className="animate-fade-up mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-4xl">Select a scenario</h1>
                <p className="mt-2 text-foam/65">{mode === "historical" ? "Each campaign is a specific, supportable historical situation with its own ports, ships, goods and events." : "Start the open-ended company mode."}</p>
              </div>
              <Button variant="ghost" onClick={() => { setStep("mode"); setMode(null); setScenarioId(null); }}>
                <ArrowLeft size={14} /> Change mode
              </Button>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenarioId(s.id)}
                    className={cn("panel w-full p-4 text-left transition-colors hover:border-cyan-300/40", scenarioId === s.id && "border-cyan-300/60 bg-cyan-400/5")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl">{s.title}</h3>
                      <Badge tone={s.mode === "modern" ? "cyan" : "gold"}>{s.era.replace("_", " ")}</Badge>
                    </div>
                    <div className="mt-0.5 text-sm text-foam/60">{s.subtitle}</div>
                    <div className="mt-2 text-xs text-foam/50">
                      {formatGameDate(dateFromIso(s.start_date))} → {formatGameDate(dateFromIso(s.end_date))} · {s.region}
                    </div>
                  </button>
                ))}
              </div>
              <div className="panel p-5">
                {scenario ? <ScenarioDetail scenario={scenario} /> : <p className="text-foam/60">Select a scenario to read its historical background, starting situation and sources.</p>}
                <div className="mt-5 flex justify-end">
                  <Button disabled={!scenario} onClick={() => setStep("empire")}>
                    Create your {scenario?.mode === "modern" ? "company" : "house"} <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === "empire" && scenario && (
          <EmpireForm
            scenario={scenario}
            onBack={() => setStep("scenario")}
            onStart={(opts) => {
              newGame({ scenario_id: scenario.id, ...opts });
              router.push("/play/world");
            }}
          />
        )}
      </div>
    </main>
  );
}

function ModeCard({ icon: Icon, title, text, bullets, onClick, accent = "gold" }: { icon: typeof Compass; title: string; text: string; bullets: string[]; onClick: () => void; accent?: "gold" | "cyan" }) {
  return (
    <button onClick={onClick} className="panel group p-6 text-left transition-colors hover:border-cyan-300/40">
      <span className={cn("inline-flex rounded-xl p-3", accent === "gold" ? "bg-gold-400/15 text-gold-300" : "bg-cyan-400/15 text-cyan-300")}>
        <Icon size={28} />
      </span>
      <h2 className="mt-4 text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-foam/70">{text}</p>
      <ul className="mt-4 space-y-1 text-sm text-foam/60">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-cyan-300">›</span> {b}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-300 group-hover:underline">
        Choose <ArrowRight size={14} />
      </span>
    </button>
  );
}

function ScenarioDetail({ scenario }: { scenario: Scenario }) {
  const catalog = getCatalog(scenario.id);
  const polity = scenario.player_polity_id ? getCivilization(scenario.player_polity_id) : null;
  const flagship = scenario.starting_ships[0];
  const flagshipClass = flagship ? catalog.ships.find((s) => s.id === flagship.class_id) : null;
  const home = catalog.portMap.get(scenario.home_port_id);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl">{scenario.title}</h2>
          <EvidenceBadge status={scenario.evidence_status} />
        </div>
        <p className="mt-1 text-foam/75">{scenario.summary}</p>
      </div>
      <div>
        <div className="label-caps mb-1">Historical background</div>
        <p className="text-sm leading-relaxed text-foam/75">{scenario.historical_background}</p>
      </div>
      {polity && (
        <div>
          <div className="label-caps mb-1">Your polity</div>
          <p className="text-sm text-foam/75">
            <strong className="text-foam">{polity.canonical_name}</strong> ({polity.start_date}–{polity.end_date ?? "present"}
            {polity.dates_approximate ? ", approximate" : ""}). {polity.political_context}
          </p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <KeyValue
          items={[
            ["Start", formatGameDate(dateFromIso(scenario.start_date))],
            ["Campaign", scenario.campaign_length_note],
            ["Home port", home?.name ?? "—"],
            ["Flagship", flagshipClass ? `${flagship?.name} (${flagshipClass.name_or_class})` : "—"],
          ]}
        />
        <KeyValue
          items={[
            ["Treasury", `${formatMoneyExact(scenario.initial_treasury, scenario.currency)} ${scenario.currency.code}`],
            ["Ports", `${catalog.ports.length}`],
            ["Goods", `${catalog.goods.length}`],
            ["Ship classes", `${catalog.ships.length}`],
          ]}
        />
      </div>
      <div className="rounded-lg border border-gold-400/25 bg-gold-400/5 p-3 text-xs text-gold-300/90">
        <strong>Player entity:</strong> {scenario.player_entity_note}
        <div className="mt-1 text-foam/60">{scenario.uncertainty_note}</div>
        {scenario.features.territory && (
          <div className="mt-2 border-t border-gold-400/15 pt-2">
            <strong>Territory:</strong> {scenario.territory_rules.summary}
          </div>
        )}
      </div>
      <div>
        <div className="label-caps mb-1">Principal sources</div>
        <SourceList ids={scenario.sources} compact />
      </div>
    </div>
  );
}

function EmpireForm({ scenario, onBack, onStart }: { scenario: Scenario; onBack: () => void; onStart: (opts: { empire_name: string; difficulty: "easy" | "normal" | "hard"; emblem: { symbol: string; color: string }; motto?: string; rules: "historical" | "sandbox"; flagship_name?: string }) => void }) {
  const isModern = scenario.mode === "modern";
  const [name, setName] = useState(isModern ? "" : "");
  const [flagship, setFlagship] = useState(scenario.starting_ships[0]?.name ?? "");
  const [motto, setMotto] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [emblem, setEmblem] = useState(isModern ? "container" : "sailboat");
  const [color, setColor] = useState(isModern ? "#22d3ee" : "#d4a62a");
  const [rules, setRules] = useState<"historical" | "sandbox">("historical");
  const catalog = getCatalog(scenario.id);
  const home = catalog.portMap.get(scenario.home_port_id);
  const treasury = Math.round(scenario.initial_treasury * (scenario.difficulty_treasury_multiplier[difficulty] ?? 1));
  const valid = name.trim().length >= 2;

  return (
    <section className="animate-fade-up mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl">{isModern ? "Found your company" : "Found your trading house"}</h1>
          <p className="mt-2 text-foam/65">
            {isModern ? "A fictional container line based at Port Klang." : `A fictional merchant house operating within the ${getCivilization(scenario.player_polity_id ?? "")?.canonical_name ?? "scenario polity"}. It will never be presented as a real historical state.`}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={14} /> Scenarios
        </Button>
      </div>
      <form
        className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onStart({ empire_name: name, difficulty, emblem: { symbol: emblem, color }, motto: motto || undefined, rules, flagship_name: flagship || undefined });
        }}
      >
        <div className="panel space-y-5 p-5">
          <Field label={isModern ? "Company name" : "House name"} hint="2 to 40 characters">
            <input type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder={isModern ? "e.g. Selat Container Lines" : "e.g. Banū Marwān of Siraf"} className="w-full" autoFocus />
          </Field>
          <Field label="Flagship name" hint={`Your starting ${catalog.ships.find((s) => s.id === scenario.starting_ships[0]?.class_id)?.name_or_class ?? "vessel"}`}>
            <input type="text" maxLength={40} value={flagship} onChange={(e) => setFlagship(e.target.value)} className="w-full" />
          </Field>
          <Field label="Motto (optional)">
            <input type="text" maxLength={80} value={motto} onChange={(e) => setMotto(e.target.value)} placeholder={isModern ? "Reliable. Everywhere." : "Fair winds and honest weights"} className="w-full" />
          </Field>
          <Field label="Emblem">
            <div className="flex flex-wrap gap-2">
              {EMBLEMS.map((e) => (
                <button type="button" key={e.id} onClick={() => setEmblem(e.id)} aria-label={e.label} className={cn("rounded-lg border p-2 transition-colors", emblem === e.id ? "border-cyan-300 bg-cyan-400/15" : "border-white/10 hover:border-white/30")}>
                  <e.icon size={18} style={{ color }} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} className={cn("h-6 w-6 rounded-full border-2", color === c ? "border-white" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
          </Field>
          <Field label="Difficulty" hint="Sets the starting treasury. Rules and prices are unchanged.">
            <div className="flex gap-2">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button type="button" key={d} onClick={() => setDifficulty(d)} className={cn("rounded-lg border px-3 py-1.5 text-sm capitalize", difficulty === d ? "border-cyan-300 bg-cyan-400/15 text-cyan-300" : "border-white/10 text-foam/70 hover:border-white/30")}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          {!isModern && (
            <Field label="Campaign rules">
              <div className="grid gap-2 sm:grid-cols-2">
                <RuleOption active={rules === "historical"} onClick={() => setRules("historical")} title="Historical" text="Documented events happen on their dates and their simulated consequences apply. The campaign ends when history says it does." />
                <RuleOption active={rules === "sandbox"} onClick={() => setRules("sandbox")} title="Alternate history (sandbox)" text="History pauses at each documented turning point and you decide: let it happen, avert it, soften it or turn it around. The campaign does not end on its historical date. Every departure from the record is labelled fiction; the historical database is never altered." />
              </div>
            </Field>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="label-caps">Preview</div>
            <div className="mt-3 flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10" style={{ background: `${color}22` }}>
                <EmblemIcon symbol={emblem} color={color} size={30} />
              </span>
              <div>
                <div className="text-2xl">{name.trim() || (isModern ? "Your company" : "Your house")}</div>
                <div className="text-sm text-foam/60">{motto || scenario.subtitle}</div>
                <div className="mt-1">
                  <Badge tone="purple">Fictional {isModern ? "company" : "house"}</Badge>
                  {!isModern && rules === "sandbox" && <Badge tone="coral" className="ml-1">Alternate history</Badge>}
                </div>
              </div>
            </div>
            <KeyValue
              className="mt-4"
              items={[
                ["Home port", home?.name ?? "—"],
                ["Start date", formatGameDate(dateFromIso(scenario.start_date))],
                ["Treasury", `${formatMoneyExact(treasury, scenario.currency)} ${scenario.currency.code}`],
                ["Starting fleet", `${scenario.starting_ships.length} vessel`],
              ]}
            />
            <p className="mt-3 text-xs text-foam/50">{scenario.currency.note}</p>
          </div>
          <div className="panel p-5">
            <div className="label-caps">Objectives</div>
            <ol className="mt-2 space-y-1.5 text-sm text-foam/75">
              {scenario.objectives.slice(0, 4).map((o) => (
                <li key={o.id} className="flex gap-2">
                  <span className="text-cyan-300">{o.order}.</span> {o.title}
                </li>
              ))}
              {scenario.objectives.length > 4 && <li className="text-foam/45">…and {scenario.objectives.length - 4} more</li>}
            </ol>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!valid}>
            <Ship size={18} /> Begin at {home?.name}
          </Button>
        </aside>
      </form>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-foam/45">{hint}</span>}
    </label>
  );
}

function RuleOption({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-lg border p-3 text-left", active ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 hover:border-white/30")}>
      <div className="text-sm text-foam">{title}</div>
      <div className="mt-1 text-xs text-foam/60">{text}</div>
    </button>
  );
}
