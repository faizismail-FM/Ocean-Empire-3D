"use client";

import Link from "next/link";
import { BookOpen, GitFork } from "lucide-react";
import { getCivilization } from "@/data";
import { CHOICE_LABELS, describeChoice, describeEffect, divergenceOptions, isTurningPoint } from "@/engine/alternate";
import { dateFromIso, formatGameDate, formatYear, isSameOrAfter } from "@/engine/calendar";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, EvidenceBadge, Panel } from "@/components/ui";
import { SourceList } from "@/components/game/SourceList";
import { HelpTip } from "@/components/game/Guide";

export default function HistoryPage() {
  const state = useGameStore((s) => s.state)!;
  const catalog = useGameStore((s) => s.catalog)!;
  const decide = useGameStore((s) => s.decideDivergence);
  const events = [...catalog.events].sort((a, b) => a.date_or_date_range.start - b.date_or_date_range.start);
  const polity = catalog.scenario.player_polity_id ? getCivilization(catalog.scenario.player_polity_id) : null;
  const sandbox = state.empire.rules === "sandbox";
  const alt = state.alternate_history;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl">History</h1><HelpTip section={sandbox ? "sandbox" : "history"} /></div>
        <p className="max-w-3xl text-sm text-foam/60">
          The documented timeline of <strong className="text-foam/80">{catalog.scenario.title}</strong>. Events marked as applied have affected your game as a simulation of plausible consequences; the record of what happened is never altered by play.
          {sandbox && <> This is an <span className="text-coral-300">alternate-history sandbox</span>: at each turning point you choose what the game does, and anything other than the documented outcome is fiction.</>}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel title="Timeline">
          {events.length === 0 && <p className="text-sm text-foam/60">The modern scenario has no scripted historical events. See the encyclopedia for the background of containerisation.</p>}
          <ol className="relative space-y-4 border-l border-white/10 pl-5">
            {events.map((e) => {
              const applied = state.applied_events.includes(e.id);
              const past = isSameOrAfter(state.date, { year: e.date_or_date_range.start, month: 1, day: 1 });
              const beforeStart = e.date_or_date_range.start < state.start_date.year;
              const pending = alt.pending_event_id === e.id;
              const divergence = alt.divergences.find((d) => d.event_id === e.id);
              const decision = alt.decisions[e.id];
              const turning = sandbox && isTurningPoint(e) && !!e.trigger_date && !beforeStart;
              const upcoming = turning && !applied && !pending;
              return (
                <li key={e.id} className="relative">
                  <span className={cn("absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2", divergence ? "border-coral-400 bg-coral-400" : pending ? "animate-pulse border-coral-300 bg-coral-400" : applied ? "border-gold-300 bg-gold-400" : past || beforeStart ? "border-foam/40 bg-navy-800" : "border-cyan-300/50 bg-navy-900")} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-cyan-300">
                      {formatYear(e.date_or_date_range.start)}{e.date_or_date_range.end && e.date_or_date_range.end !== e.date_or_date_range.start ? `–${formatYear(e.date_or_date_range.end)}` : ""}{e.date_or_date_range.approximate ? " (c.)" : ""}
                    </span>
                    <span className="text-base text-foam">{e.title}</span>
                    <EvidenceBadge status={e.evidence_status} />
                    {applied && !divergence && <Badge tone="gold">applied</Badge>}
                    {divergence && <Badge tone="coral" title="This outcome departs from the record and is fiction">fiction · {CHOICE_LABELS[divergence.choice].short}</Badge>}
                    {pending && <Badge tone="coral">awaiting your decision</Badge>}
                    {upcoming && decision && <Badge tone="purple">decided in advance: {CHOICE_LABELS[decision].short}</Badge>}
                    {beforeStart && <Badge tone="neutral">background</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foam/70">{e.summary}</p>
                  <p className="mt-1 text-xs text-foam/50">{e.historical_significance}</p>
                  {e.effects.length > 0 && e.effects[0]?.type !== "notice" && (
                    <p className="mt-1 text-xs text-gold-300/80">
                      Documented consequence (simulated): {e.effects.map((f) => describeEffect(catalog, f)).join("; ")}. {e.effects_note}
                    </p>
                  )}
                  {divergence && (
                    <p className="mt-1 text-xs text-coral-300/90">
                      <GitFork size={12} className="mr-1 inline" /> What your game did instead ({formatGameDate(divergence.date)}): {divergence.note}
                    </p>
                  )}
                  {(upcoming || pending) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-foam/55">{pending ? "Decide now:" : "Decide in advance:"}</span>
                      {divergenceOptions(e).map((choice) => (
                        <button
                          key={choice}
                          onClick={() => decide(e.id, choice)}
                          title={describeChoice(catalog, e, choice)}
                          className={cn("rounded-full border px-2 py-0.5 text-xs", (pending ? false : decision === choice) ? "border-coral-400 bg-coral-400/15 text-coral-300" : choice === "historical" ? "border-gold-400/40 text-gold-300 hover:bg-gold-400/10" : "border-white/15 text-foam/70 hover:border-coral-400/60 hover:text-foam")}
                        >
                          {CHOICE_LABELS[choice].label}
                        </button>
                      ))}
                    </div>
                  )}
                  <Link href={`/encyclopedia/events/${e.id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"><BookOpen size={12} /> Read more</Link>
                </li>
              );
            })}
          </ol>
        </Panel>
        <div className="space-y-4">
          {sandbox && (
            <Panel title={<span className="flex items-center gap-2"><GitFork size={16} className="text-coral-400" /> Divergences</span>} subtitle="Where this game departed from the documented record. Every entry is fiction.">
              {alt.divergences.length === 0 ? (
                <p className="text-sm text-foam/55">None yet. History has followed the record so far.</p>
              ) : (
                <ul className="space-y-2">
                  {alt.divergences.map((d, i) => {
                    const ev = catalog.events.find((x) => x.id === d.event_id);
                    return (
                      <li key={`${d.event_id}-${i}`} className="rounded-lg border border-coral-400/20 bg-coral-400/5 px-3 py-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-coral-300">{formatGameDate(d.date)}</span>
                          <span className="text-foam">{ev?.title ?? d.event_id}</span>
                          <Badge tone="coral">{CHOICE_LABELS[d.choice].short}</Badge>
                        </div>
                        <p className="mt-1 text-foam/65">{d.note}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-3 text-xs text-foam/50">The encyclopedia shows only the documented record; nothing chosen here changes it.</p>
            </Panel>
          )}
          <Panel title="Setting">
            <p className="text-sm leading-relaxed text-foam/75">{catalog.scenario.historical_background}</p>
            {polity && (
              <p className="mt-2 text-sm text-foam/65">
                <Link href={`/encyclopedia/civilizations/${polity.id}`} className="text-cyan-300 hover:underline">{polity.canonical_name}</Link>: {polity.political_context}
              </p>
            )}
            <p className="mt-2 text-xs text-gold-300/80">{catalog.scenario.uncertainty_note}</p>
            <p className="mt-2 text-xs text-foam/50">Campaign window: {formatYear(dateFromIso(catalog.scenario.start_date).year)} to {formatYear(dateFromIso(catalog.scenario.end_date).year)}.{sandbox && " In the sandbox the campaign continues past this date unless you let the ending event happen."}</p>
          </Panel>
          <Panel title="Sources for this scenario">
            <SourceList ids={catalog.scenario.sources} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

