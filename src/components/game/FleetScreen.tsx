"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Anchor, BookOpen, Fuel, Hammer, Navigation, Pencil, Ship, Wrench } from "lucide-react";
import type { VesselClass } from "@/data/schemas";
import { cargoCapacity, cargoUsed } from "@/engine/contracts";
import { computeModifiers } from "@/engine/modifiers";
import { canBuyShip, sellShipValue } from "@/engine/game";
import { repairCost } from "@/engine/portdev";
import { remainingDistanceNm } from "@/engine/routing";
import { estimateVoyageSeconds } from "@/engine/ship";
import { formatDuration } from "@/engine/calendar";
import { formatCoordinate, compassLabel } from "@/engine/geo";
import type { ShipState } from "@/engine/state";
import { cn, formatMoney, formatMoneyExact, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, ConfirmDialog, EvidenceBadge, KeyValue, Modal, Panel, ProgressBar, Stat, Tabs } from "@/components/ui";
import { SourceList } from "./SourceList";

type Tab = "fleet" | "shipyard" | "voyages";

export function FleetScreen() {
  const params = useSearchParams();
  const initial = (params.get("tab") as Tab | null) ?? "fleet";
  const [tab, setTab] = useState<Tab>(initial);
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const ships = Object.values(state.ships);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Fleet</h1>
          <p className="text-sm text-foam/60">{ships.length} vessel{ships.length === 1 ? "" : "s"} · {ships.filter((s) => s.status !== "docked").length} at sea</p>
        </div>
        <Tabs<Tab>
          tabs={[
            { id: "fleet", label: "Vessels" },
            { id: "shipyard", label: catalog.scenario.mode === "modern" ? "Buy ships" : "Shipyard" },
            { id: "voyages", label: "Voyage history" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "fleet" && <FleetList />}
      {tab === "shipyard" && <Shipyard />}
      {tab === "voyages" && <VoyageHistory />}
    </div>
  );
}

function FleetList() {
  const router = useRouter();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  const ships = Object.values(state.ships);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ships.map((ship) => (
        <ShipCard
          key={ship.id}
          ship={ship}
          onHelm={() => {
            setActiveShip(ship.id);
            router.push("/play/sail");
          }}
        />
      ))}
      {ships.length === 0 && <p className="text-foam/60">No ships. Visit the shipyard.</p>}
      <Panel title="Fleet summary" className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Daily upkeep" value={formatMoney(ships.reduce((sum, s) => sum + (catalog.ships.find((c) => c.id === s.class_id)?.maintenance_per_day ?? 0), 0) * computeModifiers(catalog, state).maintenance_multiplier, catalog.scenario.currency)} accent="coral" />
          <Stat label="Total capacity" value={`${formatNumber(ships.reduce((sum, s) => sum + (catalog.ships.find((c) => c.id === s.class_id)?.cargo_capacity ?? 0), 0))} ${catalog.ships[0]?.cargo_unit ?? ""}`} accent="none" />
          <Stat label="Distance sailed" value={`${formatNumber(state.stats.distance_sailed_nm)} nm`} accent="none" />
          <Stat label="Deliveries" value={state.stats.contracts_completed} accent="cyan" />
        </div>
      </Panel>
    </div>
  );
}

export function ShipCard({ ship, onHelm, compact = false }: { ship: ShipState; onHelm?: () => void; compact?: boolean }) {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const refuel = useGameStore((s) => s.refuel);
  const repair = useGameStore((s) => s.repair);
  const sellShip = useGameStore((s) => s.sellShip);
  const renameShip = useGameStore((s) => s.renameShip);
  const depart = useGameStore((s) => s.depart);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(ship.name);
  const [confirmSell, setConfirmSell] = useState(false);
  const cls = catalog.ships.find((c) => c.id === ship.class_id);
  if (!cls) return null;
  const mods = computeModifiers(catalog, state);
  const capacity = cargoCapacity(cls, mods.cargo_multiplier);
  const used = cargoUsed(ship, catalog);
  const dest = ship.route[ship.route.length - 1];
  const destPort = dest?.port_id ? catalog.portMap.get(dest.port_id) : null;
  const remaining = ship.status !== "docked" ? remainingDistanceNm(ship.position, ship.route, ship.waypoint_index) : 0;
  const eta = ship.status !== "docked" && remaining > 0 ? estimateVoyageSeconds(cls, remaining, mods) : null;
  const here = ship.docked_port_id ? catalog.portMap.get(ship.docked_port_id) : null;
  const enduranceLabel = catalog.scenario.features.fuel ? "Fuel" : "Provisions";
  const enduranceUnit = catalog.scenario.features.fuel ? "t" : "days";
  const repairPrice = ship.docked_port_id ? repairCost(catalog, state, ship.docked_port_id, cls.purchase_cost, ship.condition) : 0;
  const refuelQty = cls.endurance_capacity - ship.endurance;
  const refuelPrice = Math.round(refuelQty * catalog.scenario.fuel_price_per_unit * (here?.fee_modifier ?? 1));

  return (
    <Panel padded className={cn(ship.id === state.active_ship_id && "border-cyan-300/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {renaming ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                renameShip(ship.id, name);
                setRenaming(false);
              }}
            >
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="w-48" autoFocus />
              <Button size="sm" type="submit">Save</Button>
            </form>
          ) : (
            <h3 className="flex items-center gap-2 text-xl">
              {ship.name}
              <button onClick={() => setRenaming(true)} className="text-foam/40 hover:text-foam" aria-label="Rename">
                <Pencil size={13} />
              </button>
            </h3>
          )}
          <div className="text-sm text-foam/60">{cls.name_or_class}</div>
        </div>
        <Badge tone={ship.status === "docked" ? "neutral" : ship.status === "drifting" ? "coral" : "cyan"}>{ship.status}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Speed" value={`${ship.speed_knots.toFixed(1)} kn`} accent="none" />
        <Stat label="Heading" value={`${Math.round(ship.heading).toString().padStart(3, "0")}° ${compassLabel(ship.heading)}`} accent="none" />
        <Stat label="Location" value={<span className="text-sm">{here ? here.name : formatCoordinate(ship.position)}</span>} accent="none" />
        <Stat label="Condition" value={`${Math.round(ship.condition)}%`} accent={ship.condition < 50 ? "coral" : "none"} />
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-xs text-foam/60">
            <span>Cargo</span>
            <span className="font-mono">{formatNumber(used)} / {formatNumber(capacity)} {cls.cargo_unit}</span>
          </div>
          <ProgressBar value={used} max={capacity} />
          {ship.cargo.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {ship.cargo.map((c, i) => (
                <Badge key={i} tone={c.contract_id ? "cyan" : "neutral"}>
                  {formatNumber(c.quantity)} {catalog.goodMap.get(c.good_id)?.name ?? c.good_id}
                  {c.contract_id ? " (contract)" : ""}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex justify-between text-xs text-foam/60">
            <span>{enduranceLabel}</span>
            <span className="font-mono">{formatNumber(ship.endurance, 0)} / {formatNumber(cls.endurance_capacity)} {enduranceUnit}</span>
          </div>
          <ProgressBar value={ship.endurance} max={cls.endurance_capacity} tone={ship.endurance / cls.endurance_capacity < 0.2 ? "coral" : "gold"} />
        </div>
      </div>

      {ship.status !== "docked" && (
        <div className="mt-3 text-sm text-foam/75">
          Bound for <strong className="text-foam">{destPort?.name ?? "—"}</strong> · {formatNumber(remaining)} nm remaining · ETA {eta ? formatDuration(eta) : "—"}
          {ship.autopilot ? <Badge tone="green" className="ml-2">Autopilot</Badge> : <Badge tone="gold" className="ml-2">Manual</Badge>}
        </div>
      )}
      {ship.status === "docked" && destPort && (
        <div className="mt-3 text-sm text-foam/75">
          Route plotted to <strong className="text-foam">{destPort.name}</strong>.
        </div>
      )}

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onHelm && (
            <Button size="sm" onClick={onHelm}>
              <Navigation size={14} /> Take the helm
            </Button>
          )}
          {ship.status === "docked" && destPort && (
            <Button size="sm" variant="secondary" onClick={() => depart(ship.id)}>
              <Anchor size={14} /> Depart
            </Button>
          )}
          {ship.status === "docked" && !destPort && (
            <Link href="/play/world" className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/20 bg-navy-700/80 px-2.5 py-1.5 text-xs hover:border-cyan-300/50">
              <Navigation size={14} /> Choose destination
            </Link>
          )}
          {ship.status === "docked" && refuelQty > 0.5 && (
            <Button size="sm" variant="secondary" onClick={() => refuel(ship.id, refuelQty)} title={`${formatNumber(refuelQty, 0)} ${enduranceUnit} for ${formatMoneyExact(refuelPrice, catalog.scenario.currency)}`}>
              <Fuel size={14} /> {catalog.scenario.features.fuel ? "Refuel" : "Provision"} ({formatMoney(refuelPrice, catalog.scenario.currency)})
            </Button>
          )}
          {ship.status === "docked" && ship.condition < 100 && (
            <Button size="sm" variant="secondary" onClick={() => repair(ship.id)}>
              <Wrench size={14} /> Repair ({formatMoney(repairPrice, catalog.scenario.currency)})
            </Button>
          )}
          {ship.status === "docked" && Object.keys(state.ships).length > 1 && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmSell(true)}>
              Sell ({formatMoney(sellShipValue(cls, ship), catalog.scenario.currency)})
            </Button>
          )}
          <Link href={`/encyclopedia/ships/${cls.id}`} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foam/60 hover:bg-white/5 hover:text-foam">
            <BookOpen size={14} /> Class notes
          </Link>
        </div>
      )}
      <ConfirmDialog
        open={confirmSell}
        onCancel={() => setConfirmSell(false)}
        onConfirm={() => {
          sellShip(ship.id);
          setConfirmSell(false);
        }}
        title={`Sell ${ship.name}?`}
        message={`You will receive ${formatMoneyExact(sellShipValue(cls, ship), catalog.scenario.currency)} ${catalog.scenario.currency.code}. Market cargo on board is lost.`}
        confirmLabel="Sell vessel"
        danger
      />
    </Panel>
  );
}

function Shipyard() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const buyShip = useGameStore((s) => s.buyShip);
  const [portId, setPortId] = useState<string>(state.empire.home_port_id);
  const [buying, setBuying] = useState<VesselClass | null>(null);
  const [name, setName] = useState("");
  const yards = useMemo(() => catalog.ports.filter((p) => {
    const ps = state.ports[p.id];
    return ps && (ps.access === "home" || ps.access === "agreement" || (catalog.scenario.mode === "modern" && ps.visited));
  }), [catalog, state.ports]);
  const yardLevel = state.ports[portId]?.infrastructure.shipyard ?? 0;
  const isModern = catalog.scenario.mode === "modern";

  return (
    <div className="space-y-4">
      <Panel title={isModern ? "Acquire vessels" : "Shipwrights"} subtitle={isModern ? "Ships are delivered to the chosen port. Larger classes need terminal partnerships." : "Hulls are built where you hold a yard. Larger hulls need a bigger yard and the right know-how."}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-foam/70">
            Deliver to
            <select className="ml-2" value={portId} onChange={(e) => setPortId(e.target.value)}>
              {yards.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (yard level {state.ports[p.id]?.infrastructure.shipyard ?? 0})
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-foam/50">
            Treasury {formatMoneyExact(state.treasury, catalog.scenario.currency)} {catalog.scenario.currency.code} · Shipyard level {yardLevel} here.{" "}
            <Link href={`/play/ports?port=${portId}`} className="text-cyan-300 hover:underline">
              Upgrade
            </Link>
          </span>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.ships.map((cls) => {
          const check = canBuyShip(catalog, state, cls, portId);
          return (
            <Panel key={cls.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg">{cls.name_or_class}</h3>
                  <div className="text-xs text-foam/60">{cls.vessel_type} · {cls.length_m} m</div>
                </div>
                <EvidenceBadge status={cls.evidence_status} />
              </div>
              <KeyValue
                className="mt-3"
                items={[
                  ["Capacity", `${formatNumber(cls.cargo_capacity)} ${cls.cargo_unit}`],
                  ["Max speed", `${cls.max_speed_knots} kn`],
                  [catalog.scenario.features.fuel ? "Fuel" : "Provisions", `${formatNumber(cls.endurance_capacity)} ${catalog.scenario.features.fuel ? "t" : "days"}`],
                  ["Crew", cls.crew],
                  ["Upkeep", `${formatMoneyExact(cls.maintenance_per_day, catalog.scenario.currency)}/day`],
                  ["Requires", `Yard level ${cls.required_shipyard_level}${cls.required_technology ? ` · ${catalog.technologies.find((t) => t.id === cls.required_technology)?.name ?? cls.required_technology}` : ""}`],
                ]}
              />
              <p className="mt-3 line-clamp-3 text-xs text-foam/60">{cls.historical_notes}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <span className="font-mono text-lg text-gold-300">{formatMoney(cls.purchase_cost, catalog.scenario.currency)}</span>
                <Button size="sm" disabled={!check.ok} title={check.reason} onClick={() => { setBuying(cls); setName(""); }}>
                  <Hammer size={14} /> {isModern ? "Buy" : "Build"}
                </Button>
              </div>
              {!check.ok && <p className="mt-1 text-xs text-coral-400/80">{check.reason}</p>}
            </Panel>
          );
        })}
      </div>
      <Modal open={!!buying} onClose={() => setBuying(null)} title={`Name your ${buying?.vessel_type.toLowerCase()}`} width="max-w-md">
        {buying && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (buyShip(buying.id, name || buying.name_or_class, portId)) setBuying(null);
            }}
          >
            <input type="text" className="w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder={buying.name_or_class} maxLength={40} autoFocus />
            <p className="mt-2 text-xs text-foam/60">
              {formatMoneyExact(buying.purchase_cost, catalog.scenario.currency)} {catalog.scenario.currency.code} will be deducted. The vessel is delivered to {catalog.portMap.get(portId)?.name}.
            </p>
            <div className="mt-3">
              <SourceList ids={buying.sources} compact />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setBuying(null)}>Cancel</Button>
              <Button type="submit"><Ship size={14} /> Confirm purchase</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function VoyageHistory() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  if (state.voyages.length === 0) return <p className="text-foam/60">No completed voyages yet.</p>;
  return (
    <Panel padded={false}>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-foam/50">
          <tr>
            <th className="px-4 py-2">Ship</th>
            <th className="px-4 py-2">Route</th>
            <th className="px-4 py-2 text-right">Distance</th>
            <th className="px-4 py-2 text-right">Revenue</th>
            <th className="px-4 py-2 text-right">Expenses</th>
            <th className="px-4 py-2 text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {state.voyages.map((v) => (
            <tr key={v.id} className="border-t border-white/5">
              <td className="px-4 py-2">{v.ship_name}</td>
              <td className="px-4 py-2 text-foam/75">{catalog.portMap.get(v.origin_port_id)?.name} → {catalog.portMap.get(v.destination_port_id)?.name}</td>
              <td className="px-4 py-2 text-right font-mono">{formatNumber(v.distance_nm)} nm</td>
              <td className="px-4 py-2 text-right font-mono text-cyan-300">{formatMoney(v.revenue, catalog.scenario.currency)}</td>
              <td className="px-4 py-2 text-right font-mono text-coral-400">{formatMoney(v.expenses, catalog.scenario.currency)}</td>
              <td className={cn("px-4 py-2 text-right font-mono", v.net >= 0 ? "text-gold-300" : "text-coral-400")}>{formatMoney(v.net, catalog.scenario.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
