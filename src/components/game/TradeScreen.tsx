"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Navigation, PackageCheck, ShoppingCart } from "lucide-react";
import { cargoCapacity, cargoUsed, validateAccept } from "@/engine/contracts";
import { portMarket } from "@/engine/market";
import { computeModifiers } from "@/engine/modifiers";
import { formatDuration } from "@/engine/calendar";
import type { Contract } from "@/engine/state";
import { cn, formatMoney, formatMoneyExact, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EmptyState, Panel, SimulatedBadge, Tabs } from "@/components/ui";
import { HelpTip } from "@/components/game/Guide";
import { isRivalAssigned } from "@/engine/rivals";

type Tab = "contracts" | "market" | "active";

export function TradeScreen() {
  const params = useSearchParams();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const ensureContracts = useGameStore((s) => s.ensureContracts);
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  const active = state.active_ship_id ? state.ships[state.active_ship_id] : null;
  const dockedShips = Object.values(state.ships).filter((s) => s.status === "docked");
  const [portId, setPortId] = useState<string>(params.get("port") ?? active?.docked_port_id ?? state.empire.home_port_id);
  const [tab, setTab] = useState<Tab>("contracts");
  const port = catalog.portMap.get(portId);
  const shipsHere = dockedShips.filter((s) => s.docked_port_id === portId);
  const [chosenShipId, setShipId] = useState<string>(shipsHere[0]?.id ?? active?.id ?? "");
  const shipId = shipsHere.some((s) => s.id === chosenShipId) ? chosenShipId : shipsHere[0]?.id ?? "";
  const ship = state.ships[shipId] ?? null;

  const week = Math.floor(state.sim_seconds / (7 * 86400));
  useEffect(() => {
    ensureContracts(portId);
  }, [portId, ensureContracts, week]);

  const offers = useMemo(() => Object.values(state.contracts).filter((c) => c.status === "available" && c.origin_port_id === portId).sort((a, b) => Number(b.mission) - Number(a.mission) || b.payment - a.payment), [state.contracts, portId]);
  const activeContracts = Object.values(state.contracts).filter((c) => (c.status === "accepted" || c.status === "in_transit") && !isRivalAssigned(c));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl">Trade</h1><HelpTip section="trade" /></div>
          <p className="text-sm text-foam/60">Contracts pay on delivery. Market cargo is bought and sold at local prices. <SimulatedBadge className="ml-1 align-middle" /></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-foam/70">
            Port
            <select className="ml-2" value={portId} onChange={(e) => setPortId(e.target.value)}>
              {catalog.ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{dockedShips.some((s) => s.docked_port_id === p.id) ? " ● ship here" : ""}
                </option>
              ))}
            </select>
          </label>
          {shipsHere.length > 0 && (
            <label className="text-sm text-foam/70">
              Ship
              <select className="ml-2" value={ship?.id ?? ""} onChange={(e) => { setShipId(e.target.value); setActiveShip(e.target.value); }}>
                {shipsHere.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <Tabs<Tab>
        tabs={[
          { id: "contracts", label: `Contracts at ${port?.name ?? "port"} (${offers.length})` },
          { id: "market", label: "Market" },
          { id: "active", label: `Accepted (${activeContracts.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {shipsHere.length === 0 && tab !== "active" && (
        <div className="rounded-lg border border-gold-400/30 bg-gold-400/5 px-4 py-2 text-sm text-gold-300">
          None of your ships is docked at {port?.name}. You can browse offers, but to accept one a ship must be here.{" "}
          <Link href="/play/world" className="underline">Open the map</Link>.
        </div>
      )}

      {tab === "contracts" && (
        <div className="grid gap-3 md:grid-cols-2">
          {offers.length === 0 && <EmptyState title="No offers this week" message="Contracts refresh weekly. Developing a warehouse or commercial district here brings more offers." />}
          {offers.map((c) => (
            <ContractCard key={c.id} contract={c} shipId={ship?.status === "docked" && ship.docked_port_id === portId ? ship.id : null} />
          ))}
        </div>
      )}

      {tab === "market" && <Market portId={portId} shipId={ship?.status === "docked" && ship.docked_port_id === portId ? ship.id : null} />}

      {tab === "active" && (
        <div className="grid gap-3 md:grid-cols-2">
          {activeContracts.length === 0 && <EmptyState title="No accepted contracts" message="Accept an offer at a port where one of your ships is docked." />}
          {activeContracts.map((c) => (
            <ContractCard key={c.id} contract={c} shipId={null} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContractCard({ contract, shipId }: { contract: Contract; shipId: string | null }) {
  const router = useRouter();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const acceptContract = useGameStore((s) => s.acceptContract);
  const abandonContract = useGameStore((s) => s.abandonContract);
  const setDestination = useGameStore((s) => s.setDestination);
  const good = catalog.goodMap.get(contract.good_id);
  const origin = catalog.portMap.get(contract.origin_port_id);
  const dest = catalog.portMap.get(contract.destination_port_id);
  const ship = shipId ? state.ships[shipId] : null;
  const cls = ship ? catalog.ships.find((c) => c.id === ship.class_id) : null;
  const mods = computeModifiers(catalog, state);
  const check = ship && cls ? validateAccept(catalog, state, contract, ship, cls, mods.cargo_multiplier) : { ok: false, reason: "Dock a ship at the origin port to accept." };
  const timeLeft = contract.deadline_sim_seconds - state.sim_seconds;
  const assigned = contract.assigned_ship_id ? state.ships[contract.assigned_ship_id] : null;
  const expected = contract.payment - contract.estimated_costs;

  return (
    <div className={cn("panel p-4", contract.status !== "available" && "border-cyan-300/25")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base text-foam">
            {formatNumber(contract.quantity)} {good?.cargo_space === 1 || !good ? cls?.cargo_unit ?? "" : ""} {good?.name ?? contract.good_id}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-foam/70">
            {origin?.name} <ArrowRight size={12} /> {dest?.name}
            <span className="text-foam/40">· {formatNumber(contract.distance_nm)} nm</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={contract.status === "available" ? "neutral" : contract.status === "in_transit" ? "cyan" : "gold"}>{contract.status.replace("_", " ")}</Badge>
          {contract.mission && <Badge tone="gold">first voyage</Badge>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="label-caps">Payment</div>
          <div className="font-mono text-base text-gold-300">{formatMoney(contract.payment, catalog.scenario.currency)}</div>
        </div>
        <div>
          <div className="label-caps">Est. costs</div>
          <div className="font-mono text-base text-coral-400">{formatMoney(contract.estimated_costs, catalog.scenario.currency)}</div>
        </div>
        <div>
          <div className="label-caps">Expected profit</div>
          <div className={cn("font-mono text-base", expected >= 0 ? "text-cyan-300" : "text-coral-400")}>{formatMoney(expected, catalog.scenario.currency)}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-foam/60">
        <Clock size={12} /> {timeLeft > 0 ? `Deadline in ${formatDuration(timeLeft)}` : "Deadline passed (late penalty applies)"}
        {good?.storage === "refrigerated" && <Badge tone="cyan">reefer</Badge>}
        {assigned && <span className="ml-auto">Assigned: {assigned.name}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {contract.status === "available" && (
          <>
            <Button size="sm" disabled={!check.ok} title={check.reason} onClick={() => shipId && acceptContract(contract.id, shipId)}>
              <PackageCheck size={14} /> Accept & load
            </Button>
            {!check.ok && <span className="self-center text-xs text-coral-400/80">{check.reason}</span>}
          </>
        )}
        {contract.status === "accepted" && assigned && (
          <>
            <Button
              size="sm"
              onClick={() => {
                if (setDestination(assigned.id, contract.destination_port_id)) router.push("/play/sail");
              }}
            >
              <Navigation size={14} /> Plot course & sail
            </Button>
            <Button size="sm" variant="ghost" onClick={() => abandonContract(contract.id)} title="Return the cargo and pay a 10% penalty">
              Cancel contract
            </Button>
          </>
        )}
        {contract.status === "in_transit" && assigned && (
          <Button size="sm" variant="secondary" onClick={() => router.push("/play/sail")}>
            <Navigation size={14} /> View voyage
          </Button>
        )}
      </div>
    </div>
  );
}

function Market({ portId, shipId }: { portId: string; shipId: string | null }) {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const buyCargo = useGameStore((s) => s.buyCargo);
  const sellCargo = useGameStore((s) => s.sellCargo);
  const mods = computeModifiers(catalog, state);
  const listings = portMarket(catalog, state, portId, mods.event_price_mods);
  const ship = shipId ? state.ships[shipId] : null;
  const cls = ship ? catalog.ships.find((c) => c.id === ship.class_id) : null;
  const free = ship && cls ? cargoCapacity(cls, mods.cargo_multiplier) - cargoUsed(ship, catalog) : 0;
  const [qty, setQty] = useState<Record<string, number>>({});

  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-foam/60">
        <span>Prices drift weekly and respond to local supply, demand, warehouses and events. Values are gameplay abstractions.</span>
        {ship && cls && (
          <span className="font-mono">
            Free hold: {formatNumber(free)} {cls.cargo_unit} · Treasury {formatMoneyExact(state.treasury, catalog.scenario.currency)}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-foam/50">
            <tr>
              <th className="px-4 py-2">Good</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Available</th>
              <th className="px-4 py-2 text-right">On board</th>
              <th className="px-4 py-2 text-right">Quantity</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const onBoard = ship?.cargo.find((c) => c.good_id === l.good.id && c.contract_id === null)?.quantity ?? 0;
              const q = qty[l.good.id] ?? 10;
              const canBuy = !!ship && l.stock > 0 && q <= l.stock && q * l.good.cargo_space <= free && state.treasury >= q * l.price;
              const canSell = !!ship && onBoard > 0 && q <= onBoard;
              return (
                <tr key={l.good.id} className="border-t border-white/5">
                  <td className="px-4 py-2">
                    <Link href={`/encyclopedia/goods/${l.good.id}`} className="hover:text-cyan-300">{l.good.name}</Link>
                    <div className="mt-0.5 flex gap-1">
                      {l.supplies && <Badge tone="green">produced here</Badge>}
                      {l.demands && <Badge tone="cyan">in demand</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gold-300">{formatMoneyExact(l.price, catalog.scenario.currency)}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.stock > 0 ? formatNumber(l.stock) : "—"}</td>
                  <td className="px-4 py-2 text-right font-mono">{onBoard > 0 ? formatNumber(onBoard) : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" min={1} value={q} onChange={(e) => setQty({ ...qty, [l.good.id]: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} className="w-20 text-right" />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" disabled={!canBuy} onClick={() => ship && buyCargo(ship.id, l.good.id, q)} title={!ship ? "Dock a ship here first" : undefined}>
                        <ShoppingCart size={12} /> Buy
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!canSell} onClick={() => ship && sellCargo(ship.id, l.good.id, q)}>
                        Sell
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
