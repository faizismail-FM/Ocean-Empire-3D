"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Navigation, Store, Building2, X } from "lucide-react";
import { getInfrastructureDefinition } from "@/data/infrastructure";
import { getCivilization } from "@/data";
import { portFee } from "@/engine/portdev";
import { marketShare, rivalDefinition, rivalFeeMultiplier } from "@/engine/rivals";
import { orderFeeMultiplier, orderLabel, prosperityLabel, workforce } from "@/engine/demographics";
import { computeModifiers } from "@/engine/modifiers";
import { formatCoordinate } from "@/engine/geo";
import { formatMoneyExact } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EvidenceBadge, KeyValue, ProgressBar, SimulatedBadge } from "@/components/ui";

/** Port information and actions, shared by the World map and the Ports screen. */
export function PortDetailPanel({ portId, onClose, compact = false }: { portId: string; onClose?: () => void; compact?: boolean }) {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const catalog = useGameStore((s) => s.catalog);
  const setDestination = useGameStore((s) => s.setDestination);
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  if (!state || !catalog) return null;
  const port = catalog.portMap.get(portId);
  const ps = state.ports[portId];
  if (!port || !ps) return null;
  const polity = port.polity_id ? getCivilization(port.polity_id) : null;
  const active = state.active_ship_id ? state.ships[state.active_ship_id] : null;
  const activeClass = active ? catalog.ships.find((c) => c.id === active.class_id) : null;
  const mods = computeModifiers(catalog, state);
  const fee = activeClass ? portFee(catalog, state, portId, activeClass.cargo_capacity, mods.port_fee_multiplier * rivalFeeMultiplier(catalog, state, portId) * orderFeeMultiplier(ps)) : null;
  const competition = marketShare(state, portId).filter((m) => m.calls > 0);
  const offers = Object.values(state.contracts).filter((c) => c.status === "available" && c.origin_port_id === portId);
  const shipsHere = Object.values(state.ships).filter((s) => s.docked_port_id === portId);
  const canSail = active && !(active.status === "docked" && active.docked_port_id === portId) && (ps.access === "open" || ps.access === "home" || ps.access === "agreement");
  const infra = Object.entries(ps.infrastructure).filter(([, lvl]) => lvl > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl">{port.name}</h3>
            <Badge tone={ps.access === "home" ? "gold" : ps.access === "open" ? "cyan" : ps.access === "agreement" ? "green" : "coral"}>{ps.access}</Badge>
            <EvidenceBadge status={port.evidence_status} />
          </div>
          {port.modern_reference_name && port.modern_reference_name !== port.name && <div className="text-xs text-foam/55">Modern reference: {port.modern_reference_name}</div>}
          {port.historical_names.length > 0 && <div className="text-xs text-foam/55">Also: {port.historical_names.join(", ")}</div>}
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 text-foam/50 hover:bg-white/10 hover:text-foam" aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>

      <KeyValue
        className="mt-3"
        items={[
          ["Authority", polity ? <Link href={`/encyclopedia/civilizations/${polity.id}`} className="text-cyan-300 hover:underline">{port.historical_polity}</Link> : port.historical_polity],
          ["Position", `${formatCoordinate({ lat: port.latitude, lon: port.longitude })}${port.location_certainty !== "precise" ? ` (${port.location_certainty})` : ""}`],
          ["Port fee", fee !== null ? `${formatMoneyExact(fee, catalog.scenario.currency)} for ${active?.name}` : "—"],
          ["Contracts", `${offers.length} available`],
          ["Your ships here", shipsHere.length > 0 ? shipsHere.map((s) => s.name).join(", ") : "none"],
        ]}
      />

      {ps.population > 0 && (
        <div className="mt-3 rounded-lg bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <span className="label-caps">People and prosperity</span>
            <SimulatedBadge />
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs"><span className="text-foam/60">Prosperity</span><span className="font-mono text-foam">{Math.round(ps.prosperity)} · {prosperityLabel(ps.prosperity)}</span></div>
              <ProgressBar value={ps.prosperity} max={100} tone={ps.prosperity >= 55 ? "green" : ps.prosperity >= 40 ? "cyan" : "coral"} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-foam/60">Public order</span><span className="font-mono text-foam">{Math.round(ps.order)} · {orderLabel(ps.order)}</span></div>
              <ProgressBar value={ps.order} max={100} tone={ps.order >= 70 ? "green" : ps.order >= 45 ? "gold" : "coral"} className="mt-1" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foam/65">
            <span>Population about {ps.population >= 10 ? Math.round(ps.population) : ps.population.toFixed(1)}k</span>
            <span>Workforce {workforce(ps) >= 10 ? Math.round(workforce(ps)) : workforce(ps).toFixed(1)}k</span>
            {orderFeeMultiplier(ps) > 1 && <span className="text-coral-400/80">Disorder adds {Math.round((orderFeeMultiplier(ps) - 1) * 100)}% to port charges</span>}
          </div>
          <p className="mt-1 text-[0.68rem] text-foam/45">Ship calls, market turnover and facilities raise prosperity; closures and unrest lower it. Prosperity sizes the market and the contract board.</p>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="label-caps mb-1">Supplies</div>
          <div className="flex flex-wrap gap-1">
            {port.supplies.map((g) => (
              <Badge key={g} tone="green">{catalog.goodMap.get(g)?.name ?? g}</Badge>
            ))}
            {port.supplies.length === 0 && <span className="text-xs text-foam/50">—</span>}
          </div>
        </div>
        <div>
          <div className="label-caps mb-1">Demands</div>
          <div className="flex flex-wrap gap-1">
            {port.demands.map((g) => (
              <Badge key={g} tone="cyan">{catalog.goodMap.get(g)?.name ?? g}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="label-caps mb-1">Infrastructure</div>
        {infra.length === 0 ? (
          <span className="text-xs text-foam/50">No developed facilities.</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {infra.map(([kind, lvl]) => (
              <Badge key={kind} tone="neutral">
                {getInfrastructureDefinition(kind as Parameters<typeof getInfrastructureDefinition>[0]).name} {lvl}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {competition.length > 0 && (
        <div className="mt-3">
          <div className="label-caps mb-1">Traffic share</div>
          <div className="flex flex-wrap gap-1">
            {competition.map((m) => {
              const def = m.rival_id ? rivalDefinition(catalog, m.rival_id) : null;
              return (
                <Badge key={m.rival_id ?? "player"} tone={m.rival_id ? "neutral" : "gold"} title={`${m.calls} call${m.calls === 1 ? "" : "s"} recorded`}>
                  {def?.name ?? (m.rival_id ? m.rival_id : "Your house")} {Math.round(m.share * 100)}%
                </Badge>
              );
            })}
          </div>
          {rivalFeeMultiplier(catalog, state, portId) > 1 && <p className="mt-1 text-xs text-coral-400/80">A rival dominates this port: terminal charges are 10% higher for you.</p>}
          {rivalFeeMultiplier(catalog, state, portId) < 1 && <p className="mt-1 text-xs text-emerald-300/80">Partner&apos;s home port: your fees here are 10% lower.</p>}
        </div>
      )}

      {!compact && (
        <div className="mt-3">
          <div className="label-caps mb-1">Historical background</div>
          <p className="text-sm leading-relaxed text-foam/75">{port.historical_significance}</p>
          {port.notes && <p className="mt-1 text-xs text-gold-300/80">{port.notes}</p>}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {active && (
          <Button
            size="sm"
            disabled={!canSail}
            title={!canSail ? (ps.access === "restricted" ? "Requires an access agreement" : ps.access === "closed" ? "Closed to your ships" : "Active ship is already here") : `Plot a route for ${active.name}`}
            onClick={() => {
              if (setDestination(active.id, portId)) {
                setActiveShip(active.id);
                router.push("/play/sail");
              }
            }}
          >
            <Navigation size={14} /> Sail {active.name} here
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => router.push(`/play/trade?port=${portId}`)}>
          <Store size={14} /> Contracts & market
        </Button>
        <Button size="sm" variant="secondary" onClick={() => router.push(`/play/ports?port=${portId}`)}>
          <Building2 size={14} /> Develop
        </Button>
        <Link href={`/encyclopedia/ports/${portId}`} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foam/70 hover:bg-white/5 hover:text-foam">
          <BookOpen size={14} /> Encyclopedia
        </Link>
      </div>
    </div>
  );
}
