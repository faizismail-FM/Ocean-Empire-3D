"use client";

import Link from "next/link";
import { getCivilization } from "@/data";
import { summarizeLedger } from "@/engine/economy";
import { computeModifiers } from "@/engine/modifiers";
import { dailyAdministrationIncome } from "@/engine/portdev";
import { evaluateCondition } from "@/engine/objectives";
import { formatGameDate } from "@/engine/calendar";
import { formatMoney, formatMoneyExact, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Panel, ProgressBar, SimulatedBadge, Stat } from "@/components/ui";
import { EmblemIcon } from "@/components/game/NewGameWizard";
import { HelpTip } from "@/components/game/Guide";
import { isRivalAssigned } from "@/engine/rivals";

export default function EmpirePage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const currency = catalog.scenario.currency;
  const mods = computeModifiers(catalog, state);
  const ledger30 = summarizeLedger(state, 30);
  const upkeep = Object.values(state.ships).reduce((sum, s) => sum + (catalog.ships.find((c) => c.id === s.class_id)?.maintenance_per_day ?? 0), 0) * mods.maintenance_multiplier;
  const adminIncome = dailyAdministrationIncome(catalog, state);
  const polity = state.empire.polity_id ? getCivilization(state.empire.polity_id) : null;
  const controlled = catalog.ports.filter((p) => state.ports[p.id]?.access === "home");
  const agreements = catalog.ports.filter((p) => state.ports[p.id]?.access === "agreement");
  const visited = catalog.ports.filter((p) => state.ports[p.id]?.visited);
  const activeContracts = Object.values(state.contracts).filter((c) => (c.status === "accepted" || c.status === "in_transit") && !isRivalAssigned(c));
  const objectives = catalog.scenario.objectives.map((o) => ({ o, s: state.objectives[o.id], p: evaluateCondition(state, o.condition) }));
  const nextObjective = objectives.find((x) => x.s?.status !== "completed");
  const isHistorical = catalog.scenario.mode === "historical";
  const influence = Math.round(Object.values(state.ports).reduce((sum, p) => sum + p.influence, 0) / Math.max(1, Object.keys(state.ports).length));
  const stability = Math.round(Math.min(100, 50 + (state.treasury > 0 ? 20 : -20) + (ledger30.income >= ledger30.expenses ? 15 : -10) + Math.min(15, state.stats.contracts_completed)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10" style={{ background: `${state.empire.emblem.color}22` }}>
          <EmblemIcon symbol={state.empire.emblem.symbol} color={state.empire.emblem.color} size={30} />
        </span>
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl">{state.empire.name}</h1><HelpTip section="loop" /></div>
          <div className="text-sm text-foam/60">{state.empire.motto ?? catalog.scenario.subtitle}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="purple">Fictional {isHistorical ? "house" : "company"}</Badge>
            {polity && <Badge tone="gold">within the {polity.canonical_name}</Badge>}
            {state.empire.rules === "sandbox" && <Badge tone="coral">Alternate history</Badge>}
            <Badge tone="neutral">{state.empire.difficulty}</Badge>
          </div>
        </div>
        <div className="ml-auto text-right text-sm text-foam/60">
          <div>{formatGameDate(state.date)}</div>
          <div>Day {Math.floor(state.sim_seconds / 86400) + 1} of the campaign</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Treasury" value={formatMoney(state.treasury, currency)} hint={currency.code} accent="gold" />
        <Stat label="Income (30 days)" value={formatMoney(ledger30.income, currency)} accent="cyan" />
        <Stat label="Expenses (30 days)" value={formatMoney(ledger30.expenses, currency)} accent="coral" />
        <Stat label="Net (30 days)" value={formatMoney(ledger30.income - ledger30.expenses, currency)} accent={ledger30.income >= ledger30.expenses ? "cyan" : "coral"} />
        <Stat label="Daily upkeep" value={formatMoney(upkeep, currency)} hint={adminIncome > 0 ? `+${formatMoney(adminIncome, currency)}/day duties` : "fleet maintenance"} accent="none" />
        <Stat label="Fleet" value={Object.keys(state.ships).length} hint={`${activeContracts.length} contracts under way`} accent="none" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={isHistorical ? "Territory & access" : "Network"} subtitle={isHistorical ? "Sovereign territory belongs to the polity; your house holds ports and agreements." : "Ports served and facilities leased."}>
          <div className="space-y-2 text-sm">
            <Row label={isHistorical ? "Home port" : "Headquarters"} value={controlled.map((p) => p.name).join(", ") || "—"} />
            <Row label={isHistorical ? "Trade agreements" : "Partner terminals"} value={agreements.length > 0 ? agreements.map((p) => p.name).join(", ") : "none yet"} />
            <Row label="Ports visited" value={`${visited.length} / ${catalog.ports.length}`} />
            <Row label="Facilities built" value={`${Object.values(state.ports).reduce((sum, p) => sum + Object.values(p.infrastructure).reduce((a, b) => a + b, 0), 0)} levels`} />
            {isHistorical && <Row label="Commercial influence" value={<><ProgressBar value={influence} max={100} className="mt-1" tone="gold" /><span className="text-xs text-foam/50">{influence}/100 average across ports <SimulatedBadge className="ml-1" /></span></>} />}
          </div>
        </Panel>

        <Panel title={isHistorical ? "Standing" : "Company health"} subtitle="A few meaningful indicators rather than a population model.">
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex justify-between"><span>Stability</span><span className="font-mono">{stability}</span></div>
              <ProgressBar value={stability} max={100} tone={stability > 60 ? "green" : stability > 35 ? "gold" : "coral"} className="mt-1" />
              <div className="mt-1 text-xs text-foam/50">Derived from solvency, cash flow and deliveries. <SimulatedBadge className="ml-1" /></div>
            </div>
            <Row label="Technology" value={`${state.technologies.length} / ${catalog.technologies.length} acquired`} />
            {catalog.scenario.features.diplomacy && (
              <Row label="Diplomacy" value={`${Object.values(state.diplomacy).filter((d) => d.agreements.includes("trade_agreement")).length} trade agreements · ${Object.values(state.diplomacy).filter((d) => d.agreements.includes("port_access")).length} access grants`} />
            )}
            <Row label="Achievements" value={`${state.achievements.length}`} />
          </div>
        </Panel>

        <Panel title="Current objective" subtitle={nextObjective ? `${objectives.filter((x) => x.s?.status === "completed").length} of ${objectives.length} complete` : "All objectives complete"}>
          {nextObjective ? (
            <div>
              <div className="text-base text-foam">{nextObjective.o.title}</div>
              <p className="mt-1 text-sm text-foam/65">{nextObjective.o.description}</p>
              <ProgressBar value={nextObjective.p.current} max={nextObjective.p.target} className="mt-3" />
              <div className="mt-1 flex justify-between text-xs text-foam/50">
                <span>{formatNumber(Math.min(nextObjective.p.current, nextObjective.p.target))} / {formatNumber(nextObjective.p.target)}</span>
                {nextObjective.o.reward > 0 && <span>Reward {formatMoneyExact(nextObjective.o.reward, currency)}</span>}
              </div>
              <Link href="/play/missions" className="mt-3 inline-block text-sm text-cyan-300 hover:underline">All missions →</Link>
            </div>
          ) : (
            <p className="text-sm text-foam/65">Keep trading: the campaign continues until its historical end.</p>
          )}
        </Panel>
      </div>

      <Panel title="Ledger" subtitle="Most recent movements of the treasury." padded={false}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-foam/50">
            <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Description</th><th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {[...state.ledger].reverse().slice(0, 25).map((e) => (
              <tr key={e.id} className="border-t border-white/5">
                <td className="px-4 py-1.5 text-foam/60">{formatGameDate(e.date)}</td>
                <td className="px-4 py-1.5">{e.description}</td>
                <td className="px-4 py-1.5 text-foam/50">{e.category.replace("_", " ")}</td>
                <td className={`px-4 py-1.5 text-right font-mono ${e.amount >= 0 ? "text-cyan-300" : "text-coral-400"}`}>{e.amount >= 0 ? "+" : ""}{formatMoneyExact(e.amount, currency)}</td>
              </tr>
            ))}
            {state.ledger.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-foam/50">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-foam/55">{label}</span>
      <span className="text-right text-foam/90">{value}</span>
    </div>
  );
}
