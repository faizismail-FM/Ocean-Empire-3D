import { ALL_CIVILIZATIONS, ALL_EVENTS, ALL_FIGURES, ALL_GOODS, ALL_PORTS, ALL_ROUTES, ALL_SCENARIOS, ALL_SHIPS, ALL_SOURCES, ALL_TECHNOLOGIES } from "@/data";
import type { EvidenceStatus } from "@/data/schemas";

/** Browsable encyclopedia sections, each backed directly by the reference database. */
export const ENCYCLOPEDIA_TYPES = [
  { id: "civilizations", label: "Civilizations & polities", description: "Political entities, their dates and context." },
  { id: "scenarios", label: "Periods & campaigns", description: "The historical situations you can play." },
  { id: "ports", label: "Ports & settlements", description: "Historical and modern ports with coordinates and goods." },
  { id: "ships", label: "Ship classes", description: "Shipbuilding traditions and vessel categories." },
  { id: "goods", label: "Trade goods", description: "Commodities and where they came from." },
  { id: "technologies", label: "Technologies & practices", description: "Capabilities by scenario, with notes on evidence." },
  { id: "events", label: "Historical events", description: "Dated events and their significance." },
  { id: "figures", label: "Maritime figures", description: "Merchants, authors, rulers and admirals." },
  { id: "routes", label: "Trade networks", description: "Documented maritime routes." },
  { id: "sources", label: "Sources & further reading", description: "The bibliography behind every record." },
] as const;

export type EncyclopediaType = (typeof ENCYCLOPEDIA_TYPES)[number]["id"];

export interface EncyclopediaEntry {
  id: string;
  type: EncyclopediaType;
  title: string;
  subtitle: string;
  evidence: EvidenceStatus | null;
  sources: string[];
}

export function listEntries(type: EncyclopediaType): EncyclopediaEntry[] {
  switch (type) {
    case "civilizations":
      return ALL_CIVILIZATIONS.map((c) => ({ id: c.id, type, title: c.canonical_name, subtitle: `${c.region} · ${c.start_date}–${c.end_date ?? "present"}`, evidence: c.evidence_status, sources: c.historical_sources }));
    case "scenarios":
      return ALL_SCENARIOS.map((s) => ({ id: s.id, type, title: s.title, subtitle: s.subtitle, evidence: s.evidence_status, sources: s.sources }));
    case "ports":
      return ALL_PORTS.map((p) => ({ id: p.id, type, title: p.name, subtitle: `${p.historical_polity} · ${p.active_period.start}–${p.active_period.end ?? "present"}`, evidence: p.evidence_status, sources: p.sources }));
    case "ships":
      return ALL_SHIPS.map((s) => ({ id: s.id, type, title: s.name_or_class, subtitle: `${s.civilization_or_region} · ${s.era.replace("_", " ")}`, evidence: s.evidence_status, sources: s.sources }));
    case "goods":
      return ALL_GOODS.map((g) => ({ id: g.id, type, title: g.name, subtitle: g.category, evidence: g.evidence_status, sources: g.sources }));
    case "technologies":
      return ALL_TECHNOLOGIES.map((t) => ({ id: t.id, type, title: t.name, subtitle: t.branch.replace("_", " "), evidence: t.evidence_status, sources: t.sources }));
    case "events":
      return [...ALL_EVENTS].sort((a, b) => a.date_or_date_range.start - b.date_or_date_range.start).map((e) => ({ id: e.id, type, title: e.title, subtitle: `${e.date_or_date_range.start}${e.date_or_date_range.end && e.date_or_date_range.end !== e.date_or_date_range.start ? `–${e.date_or_date_range.end}` : ""} · ${e.location}`, evidence: e.evidence_status, sources: e.sources }));
    case "figures":
      return ALL_FIGURES.map((f) => ({ id: f.id, type, title: f.name, subtitle: f.role, evidence: f.evidence_status, sources: f.sources }));
    case "routes":
      return ALL_ROUTES.map((r) => ({ id: r.id, type, title: r.name, subtitle: `${r.period.start}–${r.period.end ?? ""}`, evidence: r.evidence_status, sources: r.sources }));
    case "sources":
      return ALL_SOURCES.map((s) => ({ id: s.id, type, title: s.title, subtitle: `${s.author_or_institution}${s.publication_year ? `, ${s.publication_year}` : ""}`, evidence: null, sources: [] }));
  }
}

export function isEncyclopediaType(value: string): value is EncyclopediaType {
  return ENCYCLOPEDIA_TYPES.some((t) => t.id === value);
}

/** Records that cite a given source id. */
export function recordsCiting(sourceId: string): EncyclopediaEntry[] {
  const all: EncyclopediaEntry[] = [];
  for (const t of ENCYCLOPEDIA_TYPES) if (t.id !== "sources") all.push(...listEntries(t.id));
  return all.filter((e) => e.sources.includes(sourceId));
}
