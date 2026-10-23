"use client";

import { useRouter } from "next/navigation";
import { formatDuration } from "@/engine/calendar";
import { formatMoneyExact, formatNumber } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Button, Modal, SimulatedBadge, Stat } from "@/components/ui";

/** Shown once after each arrival with revenue, expenses, bonuses, penalties and net result. */
export function VoyageReportModal() {
  const router = useRouter();
  const report = useGameStore((s) => s.state?.pending_report ?? null);
  const catalog = useGameStore((s) => s.catalog);
  const dismiss = useGameStore((s) => s.dismissReport);
  if (!report || !catalog) return null;
  const currency = catalog.scenario.currency;
  const origin = catalog.portMap.get(report.origin_port_id)?.name ?? report.origin_port_id;
  const destination = catalog.portMap.get(report.destination_port_id)?.name ?? report.destination_port_id;
  const duration = report.arrived_sim_seconds - report.departed_sim_seconds;

  return (
    <Modal open onClose={dismiss} title="Voyage completed" width="max-w-lg">
      <div className="flex flex-wrap items-center gap-2 text-sm text-foam/75">
        <strong className="text-foam">{report.ship_name}</strong> · {origin} → {destination}
        <SimulatedBadge />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Distance" value={`${formatNumber(report.distance_nm)} nm`} hint={formatDuration(duration)} accent="none" />
        <Stat label="Revenue" value={formatMoneyExact(report.revenue, currency)} accent="cyan" />
        <Stat label="Expenses" value={formatMoneyExact(report.expenses, currency)} hint="Port fees and fuel or provisions" accent="coral" />
        <Stat label="Bonuses" value={formatMoneyExact(report.bonuses, currency)} accent="none" />
        <Stat label="Penalties" value={formatMoneyExact(report.penalties, currency)} accent={report.penalties > 0 ? "coral" : "none"} />
        <Stat label="Net result" value={`${report.net >= 0 ? "+" : ""}${formatMoneyExact(report.net, currency)}`} accent={report.net >= 0 ? "gold" : "coral"} />
      </div>
      {report.contracts_completed.length > 0 && (
        <p className="mt-3 text-sm text-foam/75">
          {report.contracts_completed.length} contract{report.contracts_completed.length > 1 ? "s" : ""} delivered and paid.
        </p>
      )}
      {report.notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-foam/60">
          {report.notes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={dismiss}>
          Close
        </Button>
        <Button variant="secondary" onClick={() => { dismiss(); router.push("/play/trade"); }}>
          Find the next cargo
        </Button>
      </div>
    </Modal>
  );
}
