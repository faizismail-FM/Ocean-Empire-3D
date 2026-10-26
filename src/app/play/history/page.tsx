"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getCivilization } from "@/data";
import { dateFromIso, formatYear, isSameOrAfter } from "@/engine/calendar";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, EvidenceBadge, Panel } from "@/components/ui";
import { SourceList } from "@/components/game/SourceList";
import { HelpTip } from "@/components/game/Guide";

export default function HistoryPage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const events = [...catalog.events].sort((a, b) => a.date_or_date_range.start - b.date_or_date_range.start);
  const polity = catalog.scenario.player_polity_id ? getCivilization(catalog.scenario.player_polity_id) : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">History</h1><HelpTip section="history" /></div>
        <p className="max-w-3xl text-sm text-foam/60">The documented timeline of <strong className="text-foam/80">{catalog.scenario.title}</strong>. Events marked as applied have affected your game as a simulation of plausible consequences; the record of what happened is never altered by play.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel title="Timeline">
          {events.length === 0 && <p className="text-sm text-foam/60">The modern scenario has no scripted historical events. See the encyclopedia for the background of containerisation.</p>}
          <ol className="relative space-y-4 border-l border-white/10 pl-5">
            {events.map((e) => {
              const applied = state.applied_events.includes(e.id);
              const past = isSameOrAfter(state.date, { year: e.date_or_date_range.start, month: 1, day: 1 });
              const beforeStart = e.date_or_date_range.start < state.start_date.year;
              return (
                <li key={e.id} className="relative">
                  <span className={cn("absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2", applied ? "border-gold-300 bg-gold-400" : past || beforeStart ? "border-foam/40 bg-navy-800" : "border-cyan-300/50 bg-navy-900")} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-cyan-300">
                      {formatYear(e.date_or_date_range.start)}{e.date_or_date_range.end && e.date_or_date_range.end !== e.date_or_date_range.start ? `–${formatYear(e.date_or_date_range.end)}` : ""}{e.date_or_date_range.approximate ? " (c.)" : ""}
                    </span>
                    <span className="text-base text-foam">{e.title}</span>
                    <EvidenceBadge status={e.evidence_status} />
                    {applied && <Badge tone="gold">applied</Badge>}
                    {beforeStart && <Badge tone="neutral">background</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foam/70">{e.summary}</p>
                  <p className="mt-1 text-xs text-foam/50">{e.historical_significance}</p>
                  {e.effects.length > 0 && e.effects[0]?.type !== "notice" && (
                    <p className="mt-1 text-xs text-gold-300/80">
                      Simulated consequence: {e.effects.map(describeEffect).join("; ")}. {e.effects_note}
                    </p>
                  )}
                  <Link href={`/encyclopedia/events/${e.id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"><BookOpen size={12} /> Read more</Link>
                </li>
              );
            })}
          </ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Setting">
            <p className="text-sm leading-relaxed text-foam/75">{catalog.scenario.historical_background}</p>
            {polity && (
              <p className="mt-2 text-sm text-foam/65">
                <Link href={`/encyclopedia/civilizations/${polity.id}`} className="text-cyan-300 hover:underline">{polity.canonical_name}</Link>: {polity.political_context}
              </p>
            )}
            <p className="mt-2 text-xs text-gold-300/80">{catalog.scenario.uncertainty_note}</p>
            <p className="mt-2 text-xs text-foam/50">Campaign window: {formatYear(dateFromIso(catalog.scenario.start_date).year)} to {formatYear(dateFromIso(catalog.scenario.end_date).year)}.</p>
          </Panel>
          <Panel title="Sources for this scenario">
            <SourceList ids={catalog.scenario.sources} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function describeEffect(e: { type: string; port_id?: string; access?: string; multiplier?: number; good_id?: string; polity_id?: string; delta?: number; outcome?: string }): string {
  switch (e.type) {
    case "port_access": return `${e.port_id?.replace("port_", "")} becomes ${e.access}`;
    case "port_fee_modifier": return `fees at ${e.port_id?.replace("port_", "")} ×${e.multiplier}`;
    case "good_price_modifier": return `${e.good_id?.replace("good_", "")} prices ×${e.multiplier}`;
    case "relation_change": return `relations with ${e.polity_id?.replace("civ_", "")} ${e.delta && e.delta > 0 ? "+" : ""}${e.delta}`;
    case "campaign_end": return "the campaign ends";
    default: return e.type;
  }
}
