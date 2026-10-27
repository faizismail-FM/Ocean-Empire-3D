"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowUpCircle } from "lucide-react";
import { INFRASTRUCTURE } from "@/data/infrastructure";
import { canDevelop } from "@/engine/portdev";
import { cn, formatMoney, formatMoneyExact } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, Panel, ProgressBar } from "@/components/ui";
import { PortDetailPanel } from "./PortDetailPanel";
import { HelpTip } from "@/components/game/Guide";

export function PortsScreen() {
  const params = useSearchParams();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const developPort = useGameStore((s) => s.developPort);
  const [portId, setPortId] = useState<string>(params.get("port") ?? state.empire.home_port_id);
  const ps = state.ports[portId];
  const era = catalog.scenario.era;
  const defs = INFRASTRUCTURE.filter((d) => catalog.scenario.infrastructure_available.includes(d.kind));

  const grouped = {
    yours: catalog.ports.filter((p) => state.ports[p.id]?.access === "home" || state.ports[p.id]?.access === "agreement"),
    open: catalog.ports.filter((p) => state.ports[p.id]?.access === "open"),
    other: catalog.ports.filter((p) => state.ports[p.id]?.access === "restricted" || state.ports[p.id]?.access === "closed"),
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">Ports</h1><HelpTip section="ports" /></div>
        <p className="text-sm text-foam/60">
          {catalog.scenario.mode === "modern" ? "Lease and expand terminal facilities at ports you have called at." : "Develop your home port and ports where you hold a trade agreement. Territory is not for sale; access is negotiated."}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Panel padded={false} className="max-h-[70vh] overflow-y-auto p-2">
          {(["yours", "open", "other"] as const).map((group) =>
            grouped[group].length > 0 ? (
              <div key={group} className="mb-2">
                <div className="label-caps px-2 py-1">{group === "yours" ? "Your ports & agreements" : group === "open" ? "Open ports" : "Restricted or closed"}</div>
                {grouped[group].map((p) => (
                  <button key={p.id} onClick={() => setPortId(p.id)} className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5", portId === p.id && "bg-cyan-400/15 text-cyan-300")}>
                    <span className="truncate">{p.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-foam/40">
                      {(state.ports[p.id]?.population ?? 0) > 0 && <span className={cn("h-1.5 w-1.5 rounded-full", (state.ports[p.id]?.prosperity ?? 0) >= 55 ? "bg-emerald-300" : (state.ports[p.id]?.prosperity ?? 0) >= 40 ? "bg-cyan-300" : "bg-coral-400")} title={`Prosperity ${Math.round(state.ports[p.id]?.prosperity ?? 0)}`} />}
                      {Object.values(state.ports[p.id]?.infrastructure ?? {}).reduce((a, b) => a + b, 0)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null,
          )}
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PortDetailPanel portId={portId} compact />
          </Panel>
          <Panel title="Development" subtitle={`Treasury ${formatMoneyExact(state.treasury, catalog.scenario.currency)} ${catalog.scenario.currency.code}. Costs scale with the scenario economy and are gameplay abstractions.`}>
            <div className="grid gap-3 md:grid-cols-2">
              {defs.map((def) => {
                const level = ps?.infrastructure[def.kind] ?? 0;
                const check = canDevelop(catalog, state, portId, def.kind);
                const name = def.era_names?.[era] ?? def.name;
                return (
                  <div key={def.kind} className="panel-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm text-foam">{name}</div>
                        <div className="text-xs text-foam/55">{def.effect_summary}</div>
                      </div>
                      <Badge tone={level > 0 ? "cyan" : "neutral"}>Lv {level}/{def.max_level}</Badge>
                    </div>
                    <ProgressBar value={level} max={def.max_level} className="mt-2" />
                    <p className="mt-2 text-xs text-foam/60">{def.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono text-sm text-gold-300">{level < def.max_level ? formatMoney(check.cost, catalog.scenario.currency) : "Max"}</span>
                      <Button size="sm" disabled={!check.ok} title={check.reason} onClick={() => developPort(portId, def.kind)}>
                        <ArrowUpCircle size={14} /> Upgrade to {check.next_level}
                      </Button>
                    </div>
                    {!check.ok && level < def.max_level && <p className="mt-1 text-xs text-coral-400/80">{check.reason}</p>}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
