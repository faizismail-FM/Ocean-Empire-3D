"use client";

import Link from "next/link";
import { useState } from "react";
import { formatGameDate } from "@/engine/calendar";
import { formatMoneyExact } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Button, Modal, Stat } from "@/components/ui";

/** Appears when a historical campaign reaches its documented end. The save is preserved. */
export function CampaignEndModal() {
  const state = useGameStore((s) => s.state);
  const catalog = useGameStore((s) => s.catalog);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  if (!state || !catalog || state.campaign.status === "active") return null;
  const key = `${state.id}:${state.campaign.ended_sim_seconds}`;
  if (dismissedFor === key) return null;
  const completed = Object.values(state.objectives).filter((o) => o.status === "completed").length;
  const title = state.campaign.status === "victory" ? "Campaign won" : state.campaign.status === "defeat" ? "Campaign lost" : "The campaign reaches its historical end";

  return (
    <Modal open onClose={() => setDismissedFor(key)} title={title} width="max-w-lg">
      <p className="text-sm text-foam/75">{state.campaign.end_note}</p>
      <p className="mt-2 text-xs text-foam/50">Date reached: {formatGameDate(state.date)}. Your house and its achievements are fictional; the end date follows documented history.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Treasury" value={formatMoneyExact(state.treasury, catalog.scenario.currency)} accent="gold" />
        <Stat label="Deliveries" value={state.stats.contracts_completed} accent="none" />
        <Stat label="Objectives" value={`${completed}/${catalog.scenario.objectives.length}`} accent="cyan" />
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setDismissedFor(key)}>
          Review the empire
        </Button>
        <Link href="/new" className="inline-flex items-center rounded-lg bg-cyan-400/90 px-3.5 py-2 text-sm font-semibold text-navy-950 hover:bg-cyan-300">
          Start another campaign
        </Link>
      </div>
    </Modal>
  );
}
