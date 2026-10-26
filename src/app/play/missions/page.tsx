"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { evaluateCondition } from "@/engine/objectives";
import { cn, formatMoneyExact, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Panel, ProgressBar } from "@/components/ui";
import { HelpTip } from "@/components/game/Guide";

const BASIS: Record<string, { label: string; tone: "green" | "gold" | "purple"; text: string }> = {
  documented: { label: "Documented", tone: "green", text: "Inspired by an event or practice that is documented in the sources." },
  inspired: { label: "Inspired by history", tone: "gold", text: "A gameplay objective modelled on documented trade, with fictional specifics." },
  fictional: { label: "Fictional", tone: "purple", text: "A gameplay goal with no historical claim." },
};

export default function MissionsPage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const objectives = [...catalog.scenario.objectives].sort((a, b) => a.order - b.order);
  const done = objectives.filter((o) => state.objectives[o.id]?.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl">Missions</h1><HelpTip section="goal" /></div>
          <p className="text-sm text-foam/60">{done} of {objectives.length} complete. Objectives are checked continuously; rewards are paid once.</p>
        </div>
        <ProgressBar value={done} max={objectives.length} className="w-48" tone="gold" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {objectives.map((o) => {
          const s = state.objectives[o.id];
          const complete = s?.status === "completed";
          const p = evaluateCondition(state, o.condition);
          const basis = BASIS[o.historical_basis] ?? BASIS.fictional!;
          return (
            <Panel key={o.id} className={cn(complete && "border-emerald-400/30")}>
              <div className="flex items-start gap-3">
                {complete ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} /> : <Circle className="mt-0.5 shrink-0 text-foam/30" size={20} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base text-foam">{o.order}. {o.title}</span>
                    {o.tutorial && <Badge tone="cyan">tutorial</Badge>}
                    <Badge tone={basis.tone} title={basis.text}>{basis.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-foam/70">{o.description}</p>
                  {o.basis_note && <p className="mt-1 text-xs text-gold-300/80">{o.basis_note}</p>}
                  {!complete && (
                    <>
                      <ProgressBar value={p.current} max={p.target} className="mt-3" />
                      <div className="mt-1 text-xs text-foam/50">{formatNumber(Math.min(p.current, p.target))} / {formatNumber(p.target)}</div>
                    </>
                  )}
                  <div className="mt-2 text-xs text-foam/55">
                    {o.reward > 0 ? `Reward ${formatMoneyExact(o.reward, catalog.scenario.currency)} ${catalog.scenario.currency.code}` : "No monetary reward"}
                    {complete && s?.completed_sim_seconds !== null && s?.completed_sim_seconds !== undefined && ` · completed on day ${Math.floor(s.completed_sim_seconds / 86400) + 1}`}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
