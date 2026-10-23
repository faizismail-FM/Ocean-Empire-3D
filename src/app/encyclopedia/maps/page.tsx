"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_SCENARIOS, getCatalog } from "@/data";
import { WorldMap } from "@/components/map/WorldMap";
import { Badge, Tabs } from "@/components/ui";

/** Period maps: ports, approximate regions and documented routes for each scenario. */
export default function HistoricalMapsPage() {
  const [scenarioId, setScenarioId] = useState(ALL_SCENARIOS[1]?.id ?? ALL_SCENARIOS[0]!.id);
  const [selected, setSelected] = useState<string | null>(null);
  const catalog = getCatalog(scenarioId);
  const port = selected ? catalog.portMap.get(selected) : null;

  return (
    <div>
      <h1 className="text-3xl">Historical maps</h1>
      <p className="mt-1 max-w-3xl text-sm text-foam/60">
        Each layer carries its date range. Shaded regions are deliberately approximate: where precise boundary data for a period is unavailable the map says so rather than drawing an invented border. Modern borders (Natural Earth) are shown only for the modern scenario.
      </p>
      <Tabs tabs={ALL_SCENARIOS.map((s) => ({ id: s.id, label: s.title }))} value={scenarioId} onChange={(v) => { setScenarioId(v); setSelected(null); }} className="mt-4" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[520px]">
          <WorldMap catalog={catalog} state={null} selectedPortId={selected} onSelectPort={setSelected} layers={{ ships: false, routes: false, contracts: false }} className="h-full" />
        </div>
        <aside className="space-y-3">
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
          {catalog.routes.length > 0 && (
            <div className="panel p-4">
              <div className="label-caps mb-1">Documented routes</div>
              <ul className="space-y-1 text-sm">{catalog.routes.map((r) => <li key={r.id}><Link href={`/encyclopedia/routes/${r.id}`} className="text-cyan-300 hover:underline">{r.name}</Link></li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
