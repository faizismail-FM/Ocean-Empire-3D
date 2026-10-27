"use client";

import { Anchor, Handshake, Gift, Ship, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { getCivilization } from "@/data";
import { formatDuration } from "@/engine/calendar";
import { canPerformRivalAction, marketShare, rivalActionCost, type RivalAction } from "@/engine/rivals";
import type { RivalShip } from "@/engine/state";
import { remainingDistanceNm } from "@/engine/routing";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, Panel, ProgressBar, SimulatedBadge } from "@/components/ui";
import { HelpTip } from "@/components/game/Guide";

const ACTIONS: Array<{ id: RivalAction; label: string; icon: typeof Gift; text: string }> = [
  { id: "courtesy", label: "Extend courtesies", icon: Gift, text: "Hospitality for their agents and captains improves relations (+8). Once a month." },
  { id: "partnership", label: "Propose partnership", icon: Handshake, text: "They stop bidding for contracts at your home port and cut your fees at theirs by 10%. Needs relations of 60." },
];

/** Treasury shown as a band rather than a figure: the player would not know a rival's books. */
function treasuryBand(treasury: number, reference: number): { label: string; tone: "coral" | "neutral" | "cyan" | "gold" } {
  const ratio = treasury / Math.max(1, reference);
  if (ratio < 0.5) return { label: "stretched", tone: "coral" };
  if (ratio < 1.5) return { label: "solvent", tone: "neutral" };
  if (ratio < 4) return { label: "prosperous", tone: "cyan" };
  return { label: "wealthy", tone: "gold" };
}

export function RivalsScreen() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const act = useGameStore((s) => s.rivalAction);
  const defs = catalog.scenario.rivals;

  // Ports where the player has recorded calls, ranked by traffic, for the share table.
  const contestedPorts = useMemo(() => {
    const ids = new Set<string>();
    for (const v of state.voyages) ids.add(v.destination_port_id);
    ids.add(state.empire.home_port_id);
    for (const r of Object.values(state.rivals)) for (const [port, calls] of Object.entries(r.port_calls)) if (calls > 0) ids.add(port);
    return [...ids]
      .map((id) => ({ id, rows: marketShare(state, id) }))
      .map((x) => ({ ...x, total: x.rows.reduce((s, r) => s + r.calls, 0) }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [state]);

  if (defs.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">Rivals</h1><HelpTip section="rivals" /></div>
        <p className="mt-2 text-foam/60">No rival trading powers are defined for this scenario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">Rivals</h1><HelpTip section="rivals" /></div>
        <p className="max-w-3xl text-sm text-foam/60">
          Other trading powers work the same ports and contract board as you. They are gameplay inventions, even where a name is inspired by a historical community. <SimulatedBadge className="ml-1 align-middle" />
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {defs.map((def) => {
          const rival = state.rivals[def.id];
          if (!rival) return null;
          const home = catalog.portMap.get(def.home_port_id);
          const polity = def.polity_id ? getCivilization(def.polity_id) : null;
          const ships = Object.values(rival.ships);
          const atSea = ships.filter((s) => s.status === "sailing").length;
          const band = treasuryBand(rival.treasury, catalog.scenario.initial_treasury);
          const developed = Object.entries(rival.developed).filter(([, lvl]) => lvl > 0);
          return (
            <Panel key={def.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg" style={{ color: def.color }}>{def.name}</h3>
                  <div className="text-xs text-foam/55">
                    Home port {home?.name ?? def.home_port_id}
                    {polity ? ` · ${polity.canonical_name}` : ""} · {def.personality}
                  </div>
                </div>
                <Badge tone="purple">fictional</Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Stat label="Fleet" value={`${ships.length}`} hint={`${atSea} at sea`} />
                <Stat label="Deliveries" value={formatNumber(rival.stats.deliveries)} hint={`${rival.stats.contracts_taken} from the board`} />
                <Stat label="Finances" value={<Badge tone={band.tone}>{band.label}</Badge>} hint="estimate" />
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-foam/60"><span>Relations with your house</span><span className="font-mono">{Math.round(rival.relation)}/100</span></div>
                <ProgressBar value={rival.relation} max={100} tone={rival.relation >= 60 ? "green" : rival.relation >= 40 ? "cyan" : "coral"} className="mt-1" />
                {rival.partnership && <Badge tone="green" className="mt-1.5">partnership in force</Badge>}
              </div>

              <div className="mt-3">
                <div className="label-caps mb-1">Ships</div>
                <ul className="space-y-1 text-xs">
                  {ships.map((ship) => (
                    <li key={ship.id} className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2 py-1">
                      <span className="flex min-w-0 items-center gap-1.5 text-foam/85">
                        <Ship size={12} className="shrink-0 text-foam/50" /> <span className="truncate">{ship.name}</span>
                      </span>
                      <span className="shrink-0 text-foam/60">{describeShip(ship, catalog.portMap)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {developed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {developed.map(([port, lvl]) => (
                    <Badge key={port} tone="neutral" title="Cargo handling built by this rival">
                      <Anchor size={10} className="mr-1" /> {catalog.portMap.get(port)?.name ?? port} · facilities {lvl}
                    </Badge>
                  ))}
                </div>
              )}

              {rival.event_log.length > 0 && (
                <div className="mt-3">
                  <div className="label-caps mb-1">Response to events</div>
                  <ul className="space-y-1 text-xs text-foam/75">
                    {rival.event_log.slice(0, 3).map((e, i) => (
                      <li key={`${e.event_id}-${i}`} className="rounded-md border border-gold-400/20 bg-gold-400/5 px-2 py-1">
                        <span className="text-gold-300">{catalog.events.find((ev) => ev.id === e.event_id)?.title ?? e.event_id}:</span> {e.note.replace(`${def.name} `, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-xs text-foam/55">{def.note}</p>

              <div className="mt-3 space-y-1.5">
                {ACTIONS.map((a) => {
                  const check = canPerformRivalAction(catalog, state, def.id, a.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <Button size="sm" variant="secondary" disabled={!check.ok} title={check.reason ?? a.text} onClick={() => act(def.id, a.id)}>
                        <a.icon size={13} /> {a.label}
                      </Button>
                      <span className="font-mono text-xs text-gold-300">{formatMoney(rivalActionCost(catalog, a.id), catalog.scenario.currency)}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      {contestedPorts.length > 0 && (
        <Panel title={<span className="flex items-center gap-2"><TrendingUp size={16} className="text-cyan-300" /> Traffic share by port</span>} subtitle="Share of recorded calls at each port. A rival above half the traffic raises your terminal charges there by 10%.">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-foam/50">
                  <th className="py-1 pr-3 font-normal">Port</th>
                  <th className="py-1 pr-3 font-normal">Your house</th>
                  {defs.map((d) => (
                    <th key={d.id} className="py-1 pr-3 font-normal" style={{ color: d.color }}>{d.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contestedPorts.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-1.5 pr-3 text-foam">{catalog.portMap.get(p.id)?.name ?? p.id}</td>
                    <td className="py-1.5 pr-3 font-mono text-gold-300">{pct(p.rows.find((r) => r.rival_id === null)?.share ?? 0)}</td>
                    {defs.map((d) => {
                      const row = p.rows.find((r) => r.rival_id === d.id);
                      const dominant = row && row.share >= 0.5 && row.calls >= 3;
                      return (
                        <td key={d.id} className={cn("py-1.5 pr-3 font-mono", dominant ? "text-coral-400" : "text-foam/70")}>{pct(row?.share ?? 0)}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5">
      <div className="label-caps">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-foam">{value}</div>
      {hint && <div className="text-[0.65rem] text-foam/50">{hint}</div>}
    </div>
  );
}

function describeShip(ship: RivalShip, ports: Map<string, { name: string }>): string {
  if (ship.status === "docked") return `at ${ports.get(ship.docked_port_id ?? "")?.name ?? "port"}`;
  const dest = ports.get(ship.destination_port_id ?? "")?.name ?? "sea";
  const remaining = ship.route.length > 1 ? remainingDistanceNm(ship.position, ship.route, Math.min(ship.waypoint_index, ship.route.length - 1)) : 0;
  const eta = ship.speed_knots > 0.5 && remaining > 0 ? formatDuration((remaining / ship.speed_knots) * 3600) : null;
  return `→ ${dest}${eta ? ` · ${eta}` : ""}${ship.contract_id ? " · contract" : ""}`;
}
