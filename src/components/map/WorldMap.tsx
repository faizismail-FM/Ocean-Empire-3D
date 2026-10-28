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
import { CONTROL_LABELS, extentsAt, formatPeriod, polityColor, settlementsAt, tradeNetwork } from "@/lib/map-layers";
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
  /** Commercial influence rings and holdings (historical scenarios). */
  influence: boolean;
  /** Inland settlements and capitals dated to the map year. */
  settlements: boolean;
  /** Colour ports by the polity that holds them instead of by your access. */
  ownership: boolean;
  /** Your recorded trade network: voyages aggregated by port pair. */
  network: boolean;
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
  influence: true,
  settlements: true,
  ownership: false,
  network: false,
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
  /** Year the dated layers are drawn for; defaults to the game date or the scenario start. */
  year?: number;
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

export function WorldMap({ catalog, state, selectedPortId, onSelectPort, onSelectShip, layers: layerOverrides, className, bounds, interactive = true, year: yearOverride }: Props) {
  const layers = { ...DEFAULT_LAYERS, ...layerOverrides };
  const modern = catalog.scenario.features.modern_borders;
  const year = yearOverride ?? state?.date.year ?? Number(catalog.scenario.start_date.slice(0, 4));
  const extents = useMemo(() => (modern ? [] : extentsAt(catalog, year)), [catalog, year, modern]);
  const datedPolities = useMemo(() => new Set(extents.map((e) => e.polity_id).filter((id): id is string => !!id)), [extents]);
  const settlements = useMemo(() => (modern ? [] : settlementsAt(catalog, year)), [catalog, year, modern]);
  const network = useMemo(() => (layers.network ? tradeNetwork(state) : []), [layers.network, state]);
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
          {layers.borders && <path d={borderPath} fill="none" stroke={modern ? "rgba(230,244,255,0.22)" : "rgba(230,244,255,0.12)"} strokeWidth={0.5 * inv} strokeDasharray={modern ? undefined : `${1.5 * inv} ${2 * inv}`} />}

          {layers.regions &&
            !modern &&
            extents.map((e) => {
              const color = e.polity_id ? polityColor(catalog, e.polity_id) : "#f87171";
              const geometry = { type: "Polygon" as const, coordinates: [[...e.polygon, e.polygon[0]!]] };
              const d = path(geometry);
              const [cx, cy] = path.centroid(geometry);
              const fillOpacity = e.control === "direct" ? 0.24 : e.control === "rebel" ? 0.28 : e.control === "suzerainty" ? 0.14 : 0.08;
              const dash = e.control === "direct" ? undefined : e.control === "rebel" ? `${2 * inv} ${2 * inv}` : `${3 * inv} ${3 * inv}`;
              const small = e.polygon.length <= 4;
              return (
                <g
                  key={e.id}
                  onPointerEnter={() => setHover({ x: cx, y: cy, text: `${e.label} · ${CONTROL_LABELS[e.control]} · ${formatPeriod(e.period)} · ${e.evidence_status.replace("_", " ")} · sources: ${e.sources.join(", ")}` })}
                  onPointerLeave={() => setHover(null)}
                >
                  <path d={d ?? ""} fill={color} fillOpacity={fillOpacity} stroke={color} strokeOpacity={0.7} strokeDasharray={dash} strokeWidth={(e.control === "direct" ? 0.9 : 0.7) * inv} />
                  {(!small || k > 2.5) && (
                    <text x={cx} y={cy} fontSize={(small ? 8 : 9.5) * inv} fill={color} textAnchor="middle" opacity={0.9} stroke="#040b16" strokeWidth={2 * inv} paintOrder="stroke">
                      {e.label} ({formatPeriod(e.period)}{e.period.approximate ? "" : ""}, approx.)
                    </text>
                  )}
                </g>
              );
            })}

          {layers.regions &&
            !modern &&
            catalog.civilizations.filter((c) => c.approximate_region && !datedPolities.has(c.id)).map((c) => {
              const d = path({ type: "Polygon", coordinates: [[...(c.approximate_region as [number, number][]), c.approximate_region![0] as [number, number]]] });
              const anchor = c.map_anchor ? project(c.map_anchor.lon, c.map_anchor.lat) : null;
              return (
                <g key={c.id}>
                  <path d={d ?? ""} fill={`${c.color ?? "#c8a24a"}22`} stroke={`${c.color ?? "#c8a24a"}88`} strokeDasharray={`${3 * inv} ${3 * inv}`} strokeWidth={0.8 * inv} />
                  {anchor && (
                    <text x={anchor[0]} y={anchor[1]} fontSize={10 * inv} fill={c.color ?? "#c8a24a"} textAnchor="middle" opacity={0.85}>
                      {c.canonical_name} (undated, approx.)
                    </text>
                  )}
                </g>
              );
            })}

          {layers.settlements &&
            settlements.map((st) => {
              const [x, y] = project(st.longitude, st.latitude);
              const color = st.polity_id ? polityColor(catalog, st.polity_id) : "#cbd5e1";
              const size = (st.kind === "capital" ? 4.2 : 3.2) * inv;
              return (
                <g
                  key={st.id}
                  transform={`translate(${x},${y})`}
                  onPointerEnter={() => setHover({ x, y, text: `${st.name} · ${st.kind.replace("_", " ")} · ${formatPeriod(st.period)}${st.location_certainty !== "precise" ? ` · ${st.location_certainty} location` : ""} · ${st.description}` })}
                  onPointerLeave={() => setHover(null)}
                >
                  <rect x={-size / 2} y={-size / 2} width={size} height={size} fill={color} stroke="#040b16" strokeWidth={0.6 * inv} opacity={0.9} />
                  {st.kind === "capital" && <rect x={-size * 0.9} y={-size * 0.9} width={size * 1.8} height={size * 1.8} fill="none" stroke={color} strokeWidth={0.5 * inv} opacity={0.7} />}
                  <text x={size} y={size * 0.9} fontSize={8.5 * inv} fill="#cbd5e1" stroke="#040b16" strokeWidth={2 * inv} paintOrder="stroke" opacity={k > 1.4 || st.kind === "capital" ? 0.9 : 0.55}>
                    {st.name}
                  </text>
                </g>
              );
            })}

          {layers.network &&
            network.map((edge) => {
              const a = catalog.portMap.get(edge.a);
              const b = catalog.portMap.get(edge.b);
              if (!a || !b) return null;
              const d = path({ type: "LineString", coordinates: [[a.longitude, a.latitude], [b.longitude, b.latitude]] });
              return (
                <g key={`${edge.a}-${edge.b}`}>
                  <title>{`${a.name} – ${b.name}: ${edge.count} voyage${edge.count === 1 ? "" : "s"}`}</title>
                  <path d={d ?? ""} fill="none" stroke={state?.empire.emblem.color ?? "#f5c842"} strokeOpacity={0.75} strokeWidth={(0.8 + Math.log2(edge.count + 1)) * inv} strokeLinecap="round" />
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
              const color = layers.ownership ? polityColor(catalog, port.polity_id) : (ACCESS_COLORS[access] ?? "#22d3ee");
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
                  onPointerEnter={() => setHover({ x, y, text: `${port.name} · ${port.historical_polity}${offers ? ` · ${offers} contract${offers > 1 ? "s" : ""}` : ""}${ps && catalog.scenario.features.territory && ps.access !== "home" ? ` · influence ${Math.round(ps.influence)}` : ""}${ps?.holding === "settlement" ? " · your settlement" : ps?.holding === "dependency" ? " · under your protection" : ""}` })}
                  onPointerLeave={() => setHover(null)}
                >
                  {layers.influence && ps && catalog.scenario.features.territory && ps.access !== "home" && ps.influence >= 10 && (
                    <circle r={r * (1.6 + (ps.influence / 100) * 2.2)} fill={state?.empire.emblem.color ?? "#f5c842"} opacity={0.12 + (ps.influence / 100) * 0.25} stroke={state?.empire.emblem.color ?? "#f5c842"} strokeWidth={0.5 * inv} strokeOpacity={0.5} />
                  )}
                  {layers.influence && ps && ps.holding !== "none" && (
                    <rect x={-r * 0.55} y={-r * 2.9} width={r * 1.1} height={r * 1.1} fill={state?.empire.emblem.color ?? "#f5c842"} stroke="#040b16" strokeWidth={0.6 * inv} transform="rotate(45)" />
                  )}
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
      <MapLegend modern={modern} year={year} layers={layers} catalog={catalog} extentCount={extents.length} />
    </div>
  );
}

function MapLegend({ modern, year, layers, catalog, extentCount }: { modern: boolean; year: number; layers: MapLayers; catalog: ScenarioCatalog; extentCount: number }) {
  const owners = layers.ownership ? catalog.civilizations.filter((c) => catalog.ports.some((p) => p.polity_id === c.id)) : [];
  return (
    <div className="hud-glass absolute right-2 top-2 hidden max-w-[220px] p-2 text-[0.65rem] text-foam/70 sm:block">
      <div className="label-caps mb-1">Legend{!modern ? ` · ${year < 1600 ? `${year} CE` : year}` : ""}</div>
      {!layers.ownership &&
        (["home", "open", "agreement", "restricted", "closed"] as const).map((a) => (
          <div key={a} className="flex items-center gap-1.5 capitalize">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: ACCESS_COLORS[a] }} /> {a} port
          </div>
        ))}
      {layers.ownership &&
        owners.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.color ?? "#9ca3af" }} /> <span className="truncate">{c.canonical_name}</span>
          </div>
        ))}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="inline-block h-0 w-4 border-t border-dashed border-gold-400" /> documented route
      </div>
      {!modern && layers.regions && (
        <>
          <div className="mt-1 flex items-center gap-1.5"><span className="inline-block h-2 w-3 border border-foam/60 bg-foam/25" /> direct rule</div>
          <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 border border-dashed border-foam/60 bg-foam/10" /> suzerainty or sphere</div>
          <div className="text-foam/50">{extentCount} dated extent{extentCount === 1 ? "" : "s"} for {year}; outlines approximate, hover for sources.</div>
        </>
      )}
      {!modern && layers.settlements && <div className="mt-1 flex items-center gap-1.5"><span className="inline-block h-2 w-2 bg-foam/70" /> settlement or capital</div>}
      {layers.network && <div className="mt-1 flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t-2 border-gold-300" /> your trade network</div>}
      {!modern && layers.borders && <div className="mt-1 text-coral-300/80">Modern borders shown for reference only; not valid for {year}.</div>}
      {modern && <div className="mt-1 text-foam/50">Borders: present-day (Natural Earth).</div>}
    </div>
  );
}

export type { ShipState };
