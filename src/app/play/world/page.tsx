"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Layers } from "lucide-react";
import { HelpTip } from "@/components/game/Guide";
import { DEFAULT_LAYERS, WorldMap, type MapLayers } from "@/components/map/WorldMap";
import { PortDetailPanel } from "@/components/game/PortDetailPanel";
import { Badge, Button, Panel } from "@/components/ui";
import { useGameStore } from "@/store/game-store";
import { cn } from "@/lib/utils";

export default function WorldPage() {
  const router = useRouter();
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [layersOpen, setLayersOpen] = useState(false);
  const ships = Object.values(state.ships);

  const toggles: Array<{ key: keyof MapLayers; label: string; hide?: boolean }> = [
    { key: "ports", label: "Ports" },
    { key: "ships", label: "Fleet" },
    { key: "routes", label: "Planned routes" },
    { key: "contracts", label: "Contract markers" },
    { key: "rivals", label: "Rival fleets", hide: catalog.scenario.rivals.length === 0 },
    { key: "influence", label: "Your influence and holdings", hide: !catalog.scenario.features.territory },
    { key: "sealanes", label: "Sea-lane network" },
    { key: "historical_routes", label: "Documented trade routes", hide: catalog.routes.length === 0 },
    { key: "regions", label: "Approximate historical regions", hide: catalog.scenario.features.modern_borders },
    { key: "borders", label: "Modern borders", hide: !catalog.scenario.features.modern_borders },
  ];

  return (
    <div className="grid h-[calc(100vh-7rem)] min-h-[560px] gap-4 lg:grid-cols-[1fr_360px]">
      <div className="relative min-h-0 min-w-0">
        <WorldMap
          catalog={catalog}
          state={state}
          selectedPortId={selected}
          onSelectPort={setSelected}
          onSelectShip={(id) => {
            setActiveShip(id);
            router.push("/play/sail");
          }}
          layers={layers}
          className="h-full"
        />
        <div className="absolute left-2 top-2">
          <Button size="sm" variant="secondary" onClick={() => setLayersOpen((v) => !v)}>
            <Layers size={14} /> Layers
          </Button>
          {layersOpen && (
            <div className="hud-glass mt-1 w-56 p-2">
              {toggles.filter((t) => !t.hide).map((t) => (
                <label key={t.key} className="flex items-center gap-2 rounded px-1 py-1 text-xs text-foam/80 hover:bg-white/5">
                  <input type="checkbox" checked={layers[t.key]} onChange={(e) => setLayers({ ...layers, [t.key]: e.target.checked })} /> {t.label}
                </label>
              ))}
              <p className="mt-1 px-1 text-[0.65rem] text-foam/45">Ports and routes are reference data; ship positions are simulated.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto">
        {selected ? (
          <Panel className="flex-1">
            <PortDetailPanel portId={selected} onClose={() => setSelected(null)} />
          </Panel>
        ) : (
          <Panel title={<span className="flex items-center gap-2">Operations <HelpTip section="loop" /></span>} subtitle="Select a ship to take the helm, or a port to inspect it.">
            <div className="space-y-2">
              {ships.map((ship) => {
                const cls = catalog.ships.find((c) => c.id === ship.class_id);
                const dest = ship.route[ship.route.length - 1];
                const destName = dest?.port_id ? catalog.portMap.get(dest.port_id)?.name : null;
                return (
                  <button
                    key={ship.id}
                    onClick={() => {
                      setActiveShip(ship.id);
                      router.push("/play/sail");
                    }}
                    className={cn("panel-soft w-full p-3 text-left hover:border-cyan-300/40", ship.id === state.active_ship_id && "border-cyan-300/40")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-foam">{ship.name}</span>
                      <Badge tone={ship.status === "docked" ? "neutral" : ship.status === "drifting" ? "coral" : "cyan"}>{ship.status}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-foam/55">{cls?.name_or_class}</div>
                    <div className="mt-1 text-xs text-foam/70">
                      {ship.status === "docked" ? `At ${catalog.portMap.get(ship.docked_port_id ?? "")?.name ?? "sea"}` : `${ship.speed_knots.toFixed(1)} kn → ${destName ?? "no destination"}`}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 label-caps">Ports in this scenario</div>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {catalog.ports.map((p) => {
                const access = state.ports[p.id]?.access ?? p.default_access;
                const dot = access === "home" ? "bg-gold-300" : access === "agreement" ? "bg-emerald-300" : access === "open" ? "bg-cyan-300" : access === "restricted" ? "bg-coral-400" : "bg-foam/30";
                return (
                  <button key={p.id} onClick={() => setSelected(p.id)} title={`${p.name} · ${access}`} className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-xs text-foam/75 hover:border-cyan-300/30 hover:bg-white/5 hover:text-foam">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
                    <span className="truncate">{p.name}</span>
                    <ChevronRight size={12} className="ml-auto shrink-0 text-foam/30 group-hover:text-cyan-300" />
                  </button>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
