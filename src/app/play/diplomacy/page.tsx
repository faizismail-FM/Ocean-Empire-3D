"use client";

import Link from "next/link";
import { BookOpen, Gift, Handshake, KeyRound } from "lucide-react";
import { getCivilization } from "@/data";
import { canPerformDiplomacy, diplomacyCost, type DiplomaticAction } from "@/engine/game";
import { formatMoney } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EvidenceBadge, Panel, ProgressBar, SimulatedBadge } from "@/components/ui";

const ACTIONS: Array<{ id: DiplomaticAction; label: string; icon: typeof Gift; text: string }> = [
  { id: "gift", label: "Send gifts", icon: Gift, text: "An embassy with presents improves relations (+8). Once a month per polity." },
  { id: "request_access", label: "Request port access", icon: KeyRound, text: "Opens their restricted ports to your ships. Needs relations of 55." },
  { id: "trade_agreement", label: "Negotiate trade agreement", icon: Handshake, text: "Reduces fees at their ports by 15% and allows you to build there. Needs access and relations of 70." },
];

export default function DiplomacyPage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const act = useGameStore((s) => s.diplomacy);
  if (!catalog.scenario.features.diplomacy) {
    return <p className="text-foam/60">Diplomacy is not part of this scenario. Modern companies deal with port authorities through facilities and partnerships on the Ports screen.</p>;
  }
  const polities = catalog.scenario.ai_polities.map((p) => ({ meta: p, civ: getCivilization(p.polity_id), rel: state.diplomacy[p.polity_id] }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl">Diplomacy</h1>
        <p className="max-w-3xl text-sm text-foam/60">
          Relations represent your house&apos;s commercial standing with each power, not the policy of the {getCivilization(catalog.scenario.player_polity_id ?? "")?.canonical_name ?? "polity"} itself. Historical relationships are drawn from the sources; the numbers and actions are gameplay abstractions. <SimulatedBadge className="ml-1 align-middle" />
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {polities.map(({ meta, civ, rel }) => {
          if (!civ || !rel) return null;
          const ports = catalog.ports.filter((p) => p.polity_id === civ.id);
          const own = civ.id === catalog.scenario.player_polity_id;
          return (
            <Panel key={civ.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg" style={{ color: civ.color }}>{civ.canonical_name}</h3>
                  <div className="text-xs text-foam/55">{civ.start_date}–{civ.end_date ?? "present"}{civ.dates_approximate ? " (approx.)" : ""} · {civ.region}</div>
                </div>
                <EvidenceBadge status={civ.evidence_status} />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-foam/60"><span>Relations</span><span className="font-mono">{rel.relation}/100</span></div>
                <ProgressBar value={rel.relation} max={100} tone={rel.relation >= 70 ? "green" : rel.relation >= 45 ? "cyan" : "coral"} className="mt-1" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {own && <Badge tone="gold">your sovereign</Badge>}
                {rel.agreements.includes("port_access") && <Badge tone="cyan">port access</Badge>}
                {rel.agreements.includes("trade_agreement") && <Badge tone="green">trade agreement</Badge>}
                {ports.map((p) => (
                  <Badge key={p.id} tone="neutral">{p.name}: {state.ports[p.id]?.access}</Badge>
                ))}
              </div>
              {meta.note && <p className="mt-2 text-xs text-gold-300/80">{meta.note}</p>}
              <p className="mt-2 line-clamp-3 text-xs text-foam/60">{civ.political_context}</p>
              <div className="mt-3 space-y-1.5">
                {ACTIONS.map((a) => {
                  const check = canPerformDiplomacy(catalog, state, civ.id, a.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <Button size="sm" variant="secondary" disabled={!check.ok} title={check.reason ?? a.text} onClick={() => act(civ.id, a.id)}>
                        <a.icon size={13} /> {a.label}
                      </Button>
                      <span className="font-mono text-xs text-gold-300">{formatMoney(diplomacyCost(catalog, a.id), catalog.scenario.currency)}</span>
                    </div>
                  );
                })}
              </div>
              <Link href={`/encyclopedia/civilizations/${civ.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"><BookOpen size={12} /> Encyclopedia</Link>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
