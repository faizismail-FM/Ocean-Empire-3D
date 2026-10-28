"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, GitFork } from "lucide-react";
import { CHOICE_LABELS, describeChoice, divergenceOptions, pendingTurningPoint } from "@/engine/alternate";
import { formatGameDate, formatYear } from "@/engine/calendar";
import type { DivergenceChoice } from "@/engine/state";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Badge, Button, EvidenceBadge, Modal } from "@/components/ui";

/**
 * The sandbox's decision point. Shown whenever a sandbox game is held at a turning point;
 * the player may look around first, but the simulation stays paused until a choice is made.
 */
export function DivergenceModal() {
  const state = useGameStore((s) => s.state);
  const catalog = useGameStore((s) => s.catalog);
  const decide = useGameStore((s) => s.decideDivergence);
  const [hiddenFor, setHiddenFor] = useState<string | null>(null);
  if (!state || !catalog) return null;
  const event = pendingTurningPoint(catalog, state);
  if (!event || hiddenFor === event.id) return null;
  const options = divergenceOptions(event);

  return (
    <Modal open onClose={() => setHiddenFor(event.id)} title={<span className="flex items-center gap-2"><GitFork size={18} className="text-coral-400" /> A turning point in history</span>} width="max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-cyan-300">{formatYear(event.date_or_date_range.start)}{event.date_or_date_range.approximate ? " (c.)" : ""}</span>
        <span className="text-lg text-foam">{event.title}</span>
        <EvidenceBadge status={event.evidence_status} />
      </div>
      <p className="mt-2 text-sm text-foam/80">{event.summary}</p>
      <p className="mt-1 text-xs text-foam/55">{event.historical_significance}</p>
      <p className="mt-2 text-xs text-foam/50">Today is {formatGameDate(state.date)}. The game is paused until you decide.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((choice) => (
          <ChoiceCard key={choice} choice={choice} description={describeChoice(catalog, event, choice)} onClick={() => decide(event.id, choice)} />
        ))}
      </div>

      <p className="mt-4 text-xs text-foam/55">
        The documented event is what the sources record; only its simulated consequence in your game can change. Any outcome other than the documented one is fiction, is marked as such on the History screen, and never alters the encyclopedia.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/encyclopedia/events/${event.id}`} className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"><BookOpen size={12} /> Read the record and its sources</Link>
        <Button variant="ghost" size="sm" onClick={() => setHiddenFor(event.id)}>Look around first (stays paused)</Button>
      </div>
    </Modal>
  );
}

function ChoiceCard({ choice, description, onClick }: { choice: DivergenceChoice; description: string; onClick: () => void }) {
  const historical = choice === "historical";
  return (
    <button onClick={onClick} className={cn("rounded-xl border p-3 text-left transition-colors", historical ? "border-gold-400/40 bg-gold-400/5 hover:border-gold-300" : "border-white/10 hover:border-coral-400/60 hover:bg-coral-400/5")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foam">{CHOICE_LABELS[choice].label}</span>
        <Badge tone={historical ? "gold" : "coral"}>{historical ? "documented" : "fiction"}</Badge>
      </div>
      <p className="mt-1 text-xs text-foam/65">{description}</p>
    </button>
  );
}
