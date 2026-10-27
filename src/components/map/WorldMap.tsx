"use client";

import { geoEquirectangular, geoGraticule10, geoPath, type GeoPermissibleObjects, type GeoProjection } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import landTopo from "world-atlas/land-110m.json";
import countriesTopo from "world-atlas/countries-110m.json";
import type { ScenarioCatalog } from "@/data";
import type { GameState, ShipState } from "@/engine/state";
import { getLaneNode } from "@/engine/routing";
import { LANE_EDGES } from "@/data/sealanes";
import { cn } from "@/lib/utils";

/**
 * Global operations map. Pure SVG rendered with d3-geo from the locally bundled Natural
 * Earth 1:110m topology, so it needs no tile server or API key. Positions come straight
 * from the port records and ship states, which keeps them consistent with the 3D scene.
 */

export interface MapLayers {
  ports: boolean;
  ships: boolean;
  routes: boolean;
  sealanes: boolean;
  historical_routes: boolean;
  regions: boolean;
  borders: boolean;
  contracts: boolean;
  rivals: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  ports: true,
  ships: true,
  routes: true,
  sealanes: false,
  historical_routes: true,
  regions: true,
  borders: true,
  contracts: true,
  rivals: true,
};

interface Props {
  catalog: ScenarioCatalog;
  state: GameState | null;
  selectedPortId: string | null;
  onSelectPort: (id: string | null) => void;
  onSelectShip?: (id: string) => void;
  layers?: Partial<MapLayers>;
  className?: string;
  /** Lon/lat bounds override (defaults to the scenario bounds). */
  bounds?: { west: number; south: number; east: number; north: number };
  interactive?: boolean;
}

const land = feature(landTopo as unknown as Topology, (landTopo as unknown as Topology).objects.land as GeometryCollection);
const borders = mesh(countriesTopo as unknown as Topology, (countriesTopo as unknown as Topology).objects.countries as GeometryCollection, (a, b) => a !== b);
const graticule = geoGraticule10();

const ACCESS_COLORS: Record<string, string> = {
  home: "#d4a62a",
  open: "#22d3ee",
  agreement: "#34d399",
  restricted: "#f4845f",
  closed: "#7f1d1d",
};

export function WorldMap({ catalog, state, selectedPortId, onSelectPort, onSelectShip, layers: layerOverrides, className, bounds, interactive = true }: Props) {
  const layers = { ...DEFAULT_LAYERS, ...layerOverrides };
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 520 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 0) setSize({ width: r.width, height: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mapBounds = bounds ?? catalog.scenario.map_bounds;
  const projection: GeoProjection = useMemo(() => {
    const extent: [[number, number], [number, number]] = [[12, 12], [size.width - 12, size.height - 12]];
    const box: GeoPermissibleObjects = {
      type: "Polygon",
      coordinates: [[[mapBounds.west, mapBounds.south], [mapBounds.west, mapBounds.north], [mapBounds.east, mapBounds.north], [mapBounds.east, mapBounds.south], [mapBounds.west, mapBounds.south]]],
    };
    return geoEquirectangular().fitExtent(extent, box);
  }, [size, mapBounds]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const landPath = useMemo(() => path(land) ?? "", [path]);
  const borderPath = useMemo(() => path(borders) ?? "", [path]);
  const graticulePath = useMemo(() => path(graticule) ?? "", [path]);

  const project = useCallback((lon: number, lat: number): [number, number] => {
    const p = projection([lon, lat]);
    return p ? [p[0], p[1]] : [0, 0];
  }, [projection]);

  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    setTransform((t) => {
      const k = Math.min(12, Math.max(1, t.k * factor));
      const ratio = k / t.k;
      return { k, x: mx - (mx - t.x) * ratio, y: my - (my - t.y) * ratio };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setTransform((t) => ({ ...t, x: d.tx + (e.clientX - d.x), y: d.ty + (e.clientY - d.y) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) {
      // A click on empty sea clears the selection.
      if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).dataset.sea) onSelectPort(null);
    }
  };

  const ships = state ? Object.values(state.ships) : [];
  const k = transform.k;
  const inv = 1 / k;

  return (
    <div ref={containerRef} className={cn("relative h-full min-h-[360px] w-full overflow-hidden rounded-xl border border-cyan-300/15 bg-[#06192e]", className)}>
      <svg
        width={size.width}
        height={size.height}
        className={cn("block max-w-full touch-none select-none", interactive && "cursor-grab active:cursor-grabbing")}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <radialGradient id="sea-grad" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#0d3a63" />
            <stop offset="100%" stopColor="#06192e" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={size.width} height={size.height} fill="url(#sea-grad)" data-sea="1" />
        <g transform={`translate(${transform.x},${transform.y}) scale(${k})`}>
          <path d={graticulePath} fill="none" stroke="rgba(103,232,249,0.07)" strokeWidth={0.6 * inv} />
          <path d={landPath} fill="#1d3b52" stroke="#3b6b86" strokeWidth={0.6 * inv} />
          {layers.borders && catalog.scenario.features.modern_borders && <path d={borderPath} fill="none" stroke="rgba(230,244,255,0.22)" strokeWidth={0.5 * inv} />}

          {layers.regions &&
            !catalog.scenario.features.modern_borders &&
            catalog.civilizations.filter((c) => c.approximate_region).map((c) => {
              const d = path({ type: "Polygon", coordinates: [[...(c.approximate_region as [number, number][]), c.approximate_region![0] as [number, number]]] });
              const anchor = c.map_anchor ? project(c.map_anchor.lon, c.map_anchor.lat) : null;
              return (
                <g key={c.id}>
                  <path d={d ?? ""} fill={`${c.color ?? "#c8a24a"}22`} stroke={`${c.color ?? "#c8a24a"}88`} strokeDasharray={`${3 * inv} ${3 * inv}`} strokeWidth={0.8 * inv} />
                  {anchor && (
                    <text x={anchor[0]} y={anchor[1]} fontSize={10 * inv} fill={c.color ?? "#c8a24a"} textAnchor="middle" opacity={0.85}>
                      {c.canonical_name} (approx.)
                    </text>
                  )}
                </g>
              );
            })}

          {layers.sealanes &&
            LANE_EDGES.map(([a, b]) => {
              const na = getLaneNode(a);
              const nb = getLaneNode(b);
              if (!na || !nb) return null;
              const d = path({ type: "LineString", coordinates: [[na.lon, na.lat], [nb.lon, nb.lat]] });
              return <path key={`${a}-${b}`} d={d ?? ""} fill="none" stroke="rgba(103,232,249,0.14)" strokeWidth={0.7 * inv} />;
            })}

          {layers.historical_routes &&
            catalog.routes.map((r) => {
              const d = path({ type: "LineString", coordinates: r.waypoints });
              return (
                <g key={r.id}>
                  <title>{`${r.name} — documented route (${r.period.start}–${r.period.end ?? ""})`}</title>
                  <path d={d ?? ""} fill="none" stroke="rgba(212,166,42,0.55)" strokeWidth={1.1 * inv} strokeDasharray={`${5 * inv} ${4 * inv}`} />
                </g>
              );
            })}

          {layers.routes &&
            ships.map((ship) =>
              ship.route.length > 1 ? (
                <path
                  key={`route-${ship.id}`}
                  d={path({ type: "LineString", coordinates: [[ship.position.lon, ship.position.lat], ...ship.route.slice(ship.waypoint_index).map((w) => [w.lon, w.lat] as [number, number])] }) ?? ""}
                  fill="none"
                  stroke={ship.id === state?.active_ship_id ? "#67e8f9" : "rgba(103,232,249,0.5)"}
                  strokeWidth={1.2 * inv}
                  strokeDasharray={`${2 * inv} ${3 * inv}`}
                />
              ) : null,
            )}

          {layers.ports &&
            catalog.ports.map((port) => {
              const [x, y] = project(port.longitude, port.latitude);
              const ps = state?.ports[port.id];
              const access = ps?.access ?? port.default_access;
              const color = ACCESS_COLORS[access] ?? "#22d3ee";
              const r = ({ minor: 3, regional: 3.8, major: 4.6, hub: 5.4 }[port.size] ?? 4) * inv;
              const selected = selectedPortId === port.id;
              const offers = layers.contracts && state ? Object.values(state.contracts).filter((c) => c.status === "available" && c.origin_port_id === port.id).length : 0;
              return (
                <g
                  key={port.id}
                  transform={`translate(${x},${y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPort(port.id);
                  }}
                  onPointerEnter={() => setHover({ x, y, text: `${port.name} · ${port.historical_polity}${offers ? ` · ${offers} contract${offers > 1 ? "s" : ""}` : ""}` })}
                  onPointerLeave={() => setHover(null)}
                >
                  {selected && <circle r={r * 2.6} fill="none" stroke="#e6f4ff" strokeWidth={1 * inv} opacity={0.8} />}
                  {ps?.access === "home" && <circle r={r * 1.9} fill="none" stroke={color} strokeWidth={0.8 * inv} opacity={0.7} />}
                  <circle r={r} fill={color} stroke="#040b16" strokeWidth={0.8 * inv} filter={selected ? "url(#glow)" : undefined} />
                  {offers > 0 && <circle cx={r * 1.3} cy={-r * 1.3} r={1.6 * inv} fill="#e6f4ff" />}
                  {port.location_certainty !== "precise" && <circle r={r * 1.5} fill="none" stroke={color} strokeDasharray={`${1.5 * inv} ${1.5 * inv}`} strokeWidth={0.6 * inv} />}
                  <text x={r + 3 * inv} y={3 * inv} fontSize={10.5 * inv} fill="#e6f4ff" stroke="#040b16" strokeWidth={2.5 * inv} paintOrder="stroke" opacity={k > 1.6 || port.size !== "minor" ? 1 : 0.6}>
                    {port.name}
                  </text>
                </g>
              );
            })}

          {layers.ships &&
            ships.map((ship) => {
              const [x, y] = project(ship.position.lon, ship.position.lat);
              const active = ship.id === state?.active_ship_id;
              const s = 7 * inv;
              return (
                <g
                  key={ship.id}
                  transform={`translate(${x},${y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectShip?.(ship.id);
                  }}
                  onPointerEnter={() => setHover({ x, y, text: `${ship.name} · ${ship.status} · ${ship.speed_knots.toFixed(1)} kn` })}
                  onPointerLeave={() => setHover(null)}
                >
                  <g transform={`rotate(${ship.heading})`}>
                    <path d={`M0 ${-s} L${s * 0.7} ${s} L0 ${s * 0.55} L${-s * 0.7} ${s} Z`} fill={active ? "#e6f4ff" : "#9fd8ea"} stroke="#040b16" strokeWidth={0.8 * inv} filter={active ? "url(#glow)" : undefined} />
                  </g>
                  {active && <circle r={s * 1.8} fill="none" stroke="#e6f4ff" strokeWidth={0.7 * inv} opacity={0.5} />}
                </g>
              );
            })}

          {layers.rivals &&
            state &&
            catalog.scenario.rivals.flatMap((def) => {
              const rival = state.rivals[def.id];
              if (!rival) return [];
              return Object.values(rival.ships).map((ship) => {
                const [x, y] = project(ship.position.lon, ship.position.lat);
                const s = 5 * inv;
                return (
                  <g
                    key={`${def.id}:${ship.id}`}
                    transform={`translate(${x},${y})`}
                    onPointerEnter={() => setHover({ x, y, text: `${ship.name} (${def.name}) · ${ship.status === "docked" ? `at ${catalog.portMap.get(ship.docked_port_id ?? "")?.name ?? "port"}` : `→ ${catalog.portMap.get(ship.destination_port_id ?? "")?.name ?? "sea"}`}` })}
                    onPointerLeave={() => setHover(null)}
                  >
                    <g transform={`rotate(${ship.heading})`}>
                      <path d={`M0 ${-s} L${s * 0.7} ${s} L0 ${s * 0.55} L${-s * 0.7} ${s} Z`} fill={def.color} stroke="#040b16" strokeWidth={0.7 * inv} opacity={0.9} />
                    </g>
                  </g>
                );
              });
            })}
        </g>
      </svg>
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-md bg-navy-950/90 px-2 py-1 text-xs text-foam shadow" style={{ left: hover.x * k + transform.x + 10, top: hover.y * k + transform.y - 10 }}>
          {hover.text}
        </div>
      )}
      {interactive && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          <button className="hud-glass px-2 py-1 text-xs" onClick={() => setTransform((t) => ({ ...t, k: Math.min(12, t.k * 1.3) }))} aria-label="Zoom in">
            +
          </button>
          <button className="hud-glass px-2 py-1 text-xs" onClick={() => setTransform((t) => ({ ...t, k: Math.max(1, t.k / 1.3) }))} aria-label="Zoom out">
            −
          </button>
          <button className="hud-glass px-2 py-1 text-xs" onClick={() => setTransform({ k: 1, x: 0, y: 0 })}>
            Reset
          </button>
        </div>
      )}
      <MapLegend modern={catalog.scenario.features.modern_borders} />
    </div>
  );
}

function MapLegend({ modern }: { modern: boolean }) {
  return (
    <div className="hud-glass absolute right-2 top-2 hidden p-2 text-[0.65rem] text-foam/70 sm:block">
      <div className="label-caps mb-1">Legend</div>
      {(["home", "open", "agreement", "restricted", "closed"] as const).map((a) => (
        <div key={a} className="flex items-center gap-1.5 capitalize">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: ACCESS_COLORS[a] }} /> {a} port
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="inline-block h-0 w-4 border-t border-dashed border-gold-400" /> documented route
      </div>
      {!modern && <div className="mt-1 text-foam/50">Shaded regions are approximate.</div>}
      {modern && <div className="mt-1 text-foam/50">Borders: present-day (Natural Earth).</div>}
    </div>
  );
}

export type { ShipState };
