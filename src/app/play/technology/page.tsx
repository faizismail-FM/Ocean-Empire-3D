"use client";

import Link from "next/link";
import { BookOpen, FlaskConical, Lock, Check } from "lucide-react";
import { canResearch, technologyStatus } from "@/engine/tech";
import { cn, formatMoney, formatMoneyExact } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EvidenceBadge, Panel } from "@/components/ui";
import { SourceList } from "@/components/game/SourceList";
import { HelpTip } from "@/components/game/Guide";

const BRANCH_LABEL: Record<string, string> = {
  shipbuilding: "Shipbuilding",
  navigation: "Navigation",
  cartography: "Cartography",
  port_infrastructure: "Port infrastructure",
  cargo_handling: "Cargo handling",
  commercial_administration: "Commercial administration",
  maritime_communication: "Maritime communication",
  vessel_efficiency: "Vessel efficiency",
};

export default function TechnologyPage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const research = useGameStore((s) => s.research);
  const branches = [...new Set(catalog.technologies.map((t) => t.branch))];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">{catalog.scenario.mode === "modern" ? "Capabilities" : "Technology & know-how"}</h1><HelpTip section="technology" /></div>
        <p className="max-w-3xl text-sm text-foam/60">
          This tree belongs to <strong className="text-foam/80">{catalog.scenario.title}</strong> only. It describes capabilities your house can acquire in this period, not a universal history of invention; each entry notes what is documented and what is a gameplay abstraction.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((branch) => (
          <Panel key={branch} title={BRANCH_LABEL[branch] ?? branch}>
            <div className="space-y-3">
              {catalog.technologies.filter((t) => t.branch === branch).map((tech) => {
                const status = technologyStatus(catalog, state, tech);
                const check = canResearch(catalog, state, tech);
                return (
                  <div key={tech.id} className={cn("panel-soft p-3", status === "researched" && "border-emerald-400/30")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-foam">{tech.name}</span>
                          <EvidenceBadge status={tech.evidence_status} />
                        </div>
                        <p className="mt-1 text-xs text-foam/65">{tech.description}</p>
                      </div>
                      {status === "researched" ? <Badge tone="green"><Check size={10} className="mr-1 inline" />acquired</Badge> : status === "locked" ? <Badge tone="neutral"><Lock size={10} className="mr-1 inline" />locked</Badge> : <Badge tone="cyan">available</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tech.effects.map((e, i) => (
                        <Badge key={i} tone="neutral">{describeEffect(e, catalog)}</Badge>
                      ))}
                    </div>
                    {tech.prerequisites.length > 0 && (
                      <div className="mt-1 text-xs text-foam/50">Requires: {tech.prerequisites.map((p) => catalog.technologies.find((t) => t.id === p)?.name ?? p).join(", ")}</div>
                    )}
                    <details className="mt-2 text-xs text-foam/60">
                      <summary className="cursor-pointer text-foam/70">Historical note & sources</summary>
                      <p className="mt-1">{tech.historical_notes}</p>
                      <div className="mt-1"><SourceList ids={tech.sources} compact /></div>
                    </details>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono text-sm text-gold-300">{formatMoney(tech.cost, catalog.scenario.currency)}</span>
                      {status !== "researched" && (
                        <Button size="sm" disabled={!check.ok} title={check.reason} onClick={() => research(tech.id)}>
                          <FlaskConical size={14} /> Acquire
                        </Button>
                      )}
                    </div>
                    {!check.ok && status !== "researched" && <div className="mt-1 text-xs text-coral-400/80">{check.reason}</div>}
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
      <p className="text-xs text-foam/50">
        Treasury {formatMoneyExact(state.treasury, catalog.scenario.currency)} {catalog.scenario.currency.code}.{" "}
        <Link href="/encyclopedia/technologies" className="inline-flex items-center gap-1 text-cyan-300 hover:underline"><BookOpen size={12} /> Encyclopedia: technologies</Link>
      </p>
    </div>
  );
}

function describeEffect(e: { type: string; value?: number; ship_class_id?: string; infrastructure?: string }, catalog: NonNullable<ReturnType<typeof useGameStore.getState>["catalog"]>): string {
  const pct = (v: number) => `${v >= 1 ? "+" : "−"}${Math.round(Math.abs(v - 1) * 100)}%`;
  switch (e.type) {
    case "speed_multiplier": return `${pct(e.value ?? 1)} speed`;
    case "consumption_multiplier": return `${pct(e.value ?? 1)} ${catalog.scenario.features.fuel ? "fuel" : "provisions"}`;
    case "cargo_multiplier": return `${pct(e.value ?? 1)} cargo`;
    case "port_fee_multiplier": return `${pct(e.value ?? 1)} port fees`;
    case "contract_payment_multiplier": return `${pct(e.value ?? 1)} contract pay`;
    case "maintenance_multiplier": return `${pct(e.value ?? 1)} upkeep`;
    case "extra_contracts": return `+${e.value} contract offers`;
    case "unlock_ship": return `Unlocks ${catalog.ships.find((s) => s.id === e.ship_class_id)?.name_or_class ?? e.ship_class_id}`;
    case "unlock_infrastructure": return `Unlocks ${e.infrastructure}`;
    default: return e.type;
  }
}
