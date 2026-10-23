import Link from "next/link";
import { getSource } from "@/data";

/** Renders the bibliography entries attached to a historical record. */
export function SourceList({ ids, compact = false }: { ids: string[]; compact?: boolean }) {
  const sources = ids.map((id) => getSource(id)).filter((s): s is NonNullable<typeof s> => !!s);
  if (sources.length === 0) {
    return <p className="text-xs text-coral-400/80">No source recorded. This record still requires verification.</p>;
  }
  return (
    <ul className={compact ? "space-y-1 text-xs text-foam/70" : "space-y-2 text-sm text-foam/80"}>
      {sources.map((s) => (
        <li key={s.id} className="leading-snug">
          <Link href={`/encyclopedia/sources/${s.id}`} className="text-cyan-300 hover:underline">
            {s.author_or_institution}
          </Link>
          {s.publication_year ? ` (${s.publication_year}). ` : ". "}
          <span className="italic">{s.title}</span>
          {!compact && s.url_or_reference && <span className="text-foam/50">. {s.url_or_reference}</span>}
          {!compact && s.notes && <div className="mt-0.5 text-xs text-gold-300/80">{s.notes}</div>}
        </li>
      ))}
    </ul>
  );
}
