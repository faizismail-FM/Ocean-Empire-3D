"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import { dateFromIso } from "@/engine/calendar";
import { CONTROL_LABELS, extentsAt, formatPeriod, settlementsAt } from "@/lib/map-layers";
import { DEFAULT_LAYERS, WorldMap, type MapLayers } from "@/components/map/WorldMap";
import { Badge, EvidenceBadge, Tabs } from "@/components/ui";
import { SourceList } from "@/components/game/SourceList";

/**
 * Period maps: ports, dated territorial control, settlements and documented routes for each
 * scenario, with a year slider so the control layer can be read at any date in the window.
 */
export default function HistoricalMapsPage() {
  const [scenarioId, setScenarioId] = useState(ALL_SCENARIOS[1]?.id ?? ALL_SCENARIOS[0]!.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [yearByScenario, setYearByScenario] = useState<Record<string, number>>({});
  const [layers, setLayers] = useState<Pick<MapLayers, "regions" | "settlements" | "ownership" | "historical_routes" | "borders" | "sealanes">>({ regions: true, settlements: true, ownership: false, historical_routes: true, borders: false, sealanes: false });
  const catalog = getCatalog(scenarioId);
  const modern = catalog.scenario.features.modern_borders;
  const startYear = dateFromIso(catalog.scenario.start_date).year;
  const endYear = dateFromIso(catalog.scenario.end_date).year;
  const year = yearByScenario[scenarioId] ?? startYear;
  const port = selected ? catalog.portMap.get(selected) : null;
  const extents = useMemo(() => [...extentsAt(catalog, year)].reverse(), [catalog, year]);
  const settlements = useMemo(() => settlementsAt(catalog, year), [catalog, year]);
  const changes = useMemo(() => {
    // Years inside the window at which the control layer changes.
    const years = new Set<number>();
    for (const e of catalog.extents) {
      if (e.period.start > startYear && e.period.start <= endYear) years.add(e.period.start);
      if (e.period.end !== null && e.period.end >= startYear && e.period.end < endYear) years.add(e.period.end + 1);
    }
    return [...years].sort((a, b) => a - b);
  }, [catalog, startYear, endYear]);

  const toggles: Array<{ key: keyof typeof layers; label: string; hide?: boolean }> = [
    { key: "regions", label: "Territorial control (dated)", hide: modern },
    { key: "settlements", label: "Settlements and capitals", hide: modern },
    { key: "ownership", label: "Port ownership", hide: modern },
    { key: "historical_routes", label: "Documented routes", hide: catalog.routes.length === 0 },
    { key: "sealanes", label: "Sea-lane network" },
    { key: "borders", label: modern ? "Modern borders" : "Modern borders (reference only)" },
  ];

  return (
    <div>
      <h1 className="text-3xl">Historical maps</h1>
      <p className="mt-1 max-w-3xl text-sm text-foam/60">
        Every layer carries its dates and sources. Territorial outlines are deliberately coarse and labelled approximate: where the scholarship gives no precise boundary for a period, the map says so rather than drawing one. Present-day borders are drawn only on request for historical periods, and then marked as reference only.
      </p>
      <Tabs tabs={ALL_SCENARIOS.map((s) => ({ id: s.id, label: s.title }))} value={scenarioId} onChange={(v) => { setScenarioId(v); setSelected(null); }} className="mt-4" />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foam/70">
        {!modern && (
          <label className="flex items-center gap-2">
            <span className="label-caps">Year</span>
            <input type="range" min={startYear} max={endYear} value={year} onChange={(e) => setYearByScenario({ ...yearByScenario, [scenarioId]: Number(e.target.value) })} className="w-48" aria-label="Map year" />
            <span className="font-mono text-foam">{year < 1600 ? `${year} CE` : year}</span>
          </label>
        )}
        {!modern && changes.length > 0 && (
          <span className="flex flex-wrap items-center gap-1">
            <span className="text-foam/45">changes:</span>
            {changes.map((y) => (
              <button key={y} onClick={() => setYearByScenario({ ...yearByScenario, [scenarioId]: y })} className={`rounded-full border px-1.5 py-0.5 font-mono ${y === year ? "border-cyan-300 text-cyan-300" : "border-white/15 text-foam/60 hover:border-cyan-300/50"}`}>
                {y}
              </button>
            ))}
          </span>
        )}
        <span className="flex flex-wrap gap-3">
          {toggles.filter((t) => !t.hide).map((t) => (
            <label key={t.key} className="flex items-center gap-1.5">
              <input type="checkbox" checked={layers[t.key]} onChange={(e) => setLayers({ ...layers, [t.key]: e.target.checked })} /> {t.label}
            </label>
          ))}
        </span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="h-[560px]">
          <WorldMap catalog={catalog} state={null} selectedPortId={selected} onSelectPort={setSelected} year={year} layers={{ ...DEFAULT_LAYERS, ships: false, routes: false, contracts: false, rivals: false, influence: false, network: false, ...layers }} className="h-full" />
        </div>
        <aside className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          <div className="panel p-4">
            <div className="text-lg">{catalog.scenario.title}</div>
            <div className="text-xs text-foam/55">{catalog.scenario.start_date} to {catalog.scenario.end_date}</div>
            <p className="mt-2 text-sm text-foam/70">{catalog.scenario.summary}</p>
          </div>
          {port ? (
            <div className="panel p-4">
              <div className="flex items-center justify-between"><div className="text-lg">{port.name}</div><Badge tone="neutral">{port.location_certainty}</Badge></div>
              <div className="text-xs text-foam/55">{port.historical_polity} · {port.active_period.start}–{port.active_period.end ?? "present"}</div>
              <p className="mt-2 text-sm text-foam/70">{port.historical_significance}</p>
              <Link href={`/encyclopedia/ports/${port.id}`} className="mt-2 inline-block text-sm text-cyan-300 hover:underline">Full entry →</Link>
            </div>
          ) : (
            <div className="panel p-4 text-sm text-foam/60">Select a port for its period record.</div>
          )}
          {!modern && layers.regions && (
            <div className="panel p-4">
              <div className="label-caps mb-1">Territorial control in {year < 1600 ? `${year} CE` : year}</div>
              {extents.length === 0 && <p className="text-xs text-foam/55">No dated extent recorded for this year.</p>}
              <ul className="space-y-2 text-xs">
                {extents.map((e) => (
                  <li key={e.id} className="border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {e.polity_id ? <Link href={`/encyclopedia/civilizations/${e.polity_id}`} className="text-cyan-300 hover:underline">{e.label}</Link> : <span className="text-foam">{e.label}</span>}
                      <EvidenceBadge status={e.evidence_status} />
                    </div>
                    <div className="text-foam/60">{CONTROL_LABELS[e.control]} · {formatPeriod(e.period)}{e.period.note ? ` · ${e.period.note}` : ""}</div>
                    {e.note && <div className="text-foam/50">{e.note}</div>}
                    <SourceList ids={e.sources} compact />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!modern && layers.settlements && settlements.length > 0 && (
            <div className="panel p-4">
              <div className="label-caps mb-1">Settlements and capitals in {year < 1600 ? `${year} CE` : year}</div>
              <ul className="space-y-1.5 text-xs">
                {settlements.map((st) => (
                  <li key={st.id}>
                    <span className="text-foam">{st.name}</span> <span className="text-foam/50">· {st.kind.replace("_", " ")} · {formatPeriod(st.period)}</span>
                    <div className="text-foam/60">{st.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {catalog.routes.length > 0 && (
            <div className="panel p-4">
              <div className="label-caps mb-1">Documented routes</div>
              <ul className="space-y-1 text-sm">{catalog.routes.map((r) => <li key={r.id}><Link href={`/encyclopedia/routes/${r.id}`} className="text-cyan-300 hover:underline">{r.name}</Link> <span className="text-xs text-foam/50">({formatPeriod(r.period)})</span></li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
