import type { Metadata } from "next";
import Link from "next/link";
import { ENCYCLOPEDIA_TYPES, listEntries } from "@/lib/encyclopedia";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Encyclopedia" };

export default function EncyclopediaIndex() {
  return (
    <div>
      <h1 className="text-4xl">Civilization Encyclopedia</h1>
      <p className="mt-2 max-w-3xl text-foam/70">
        Every record in the game&apos;s historical database, with its sources and an evidence rating. Entries are short by design. A record is never described as verified merely because it exists here: look for the rating on each page, and the research notes that list what still needs checking.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge tone="green">Established</Badge>
        <Badge tone="cyan">Interpretation</Badge>
        <Badge tone="gold">Reconstruction</Badge>
        <Badge tone="coral">Uncertain</Badge>
        <Badge tone="purple">Fictional</Badge>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/encyclopedia/maps" className="panel p-4 transition-colors hover:border-gold-400/50">
          <div className="text-lg">Historical maps</div>
          <div className="mt-1 text-sm text-foam/60">Approximate regions, documented routes and period ports for each campaign.</div>
        </Link>
        {ENCYCLOPEDIA_TYPES.map((t) => (
          <Link key={t.id} href={`/encyclopedia/${t.id}`} className="panel p-4 transition-colors hover:border-cyan-300/40">
            <div className="flex items-center justify-between">
              <div className="text-lg">{t.label}</div>
              <Badge tone="neutral">{listEntries(t.id).length}</Badge>
            </div>
            <div className="mt-1 text-sm text-foam/60">{t.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
