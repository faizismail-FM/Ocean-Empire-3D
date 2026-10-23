import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENCYCLOPEDIA_TYPES, isEncyclopediaType, listEntries } from "@/lib/encyclopedia";
import { EvidenceBadge } from "@/components/ui";

export function generateStaticParams() {
  return ENCYCLOPEDIA_TYPES.map((t) => ({ type: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const meta = ENCYCLOPEDIA_TYPES.find((t) => t.id === type);
  return { title: meta ? meta.label : "Encyclopedia" };
}

export default async function EncyclopediaTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isEncyclopediaType(type)) notFound();
  const meta = ENCYCLOPEDIA_TYPES.find((t) => t.id === type)!;
  const entries = listEntries(type);
  return (
    <div>
      <h1 className="text-3xl">{meta.label}</h1>
      <p className="mt-1 text-foam/60">{meta.description}</p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {entries.map((e) => (
          <li key={e.id}>
            <Link href={`/encyclopedia/${type}/${e.id}`} className="panel-soft flex items-start justify-between gap-3 p-3 transition-colors hover:border-cyan-300/40">
              <span>
                <span className="block text-foam">{e.title}</span>
                <span className="block text-xs text-foam/55">{e.subtitle}</span>
              </span>
              {e.evidence && <EvidenceBadge status={e.evidence} />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
