import { ALL_CIVILIZATIONS, ALL_EVENTS, ALL_FIGURES, ALL_GOODS, ALL_PORTS, ALL_ROUTES, ALL_SCENARIOS, ALL_SHIPS, ALL_SOURCES, ALL_TECHNOLOGIES } from "@/data";
import type { EvidenceStatus, HistoricalSource } from "@/data/schemas";
import { isEncyclopediaType, type EncyclopediaType } from "./encyclopedia";

/**
 * Retrieval for the history assistant. The assistant may only explain what the
 * encyclopedia already records, so this module assembles exactly that: the entry itself,
 * the records it points to, and the bibliography behind them. Nothing is fetched from
 * outside the game's own database.
 */

export interface GroundingMaterial {
  type: EncyclopediaType;
  id: string;
  title: string;
  evidence: EvidenceStatus | null;
  /** The entry, serialised for the model. */
  record: string;
  /** Closely related records (a port's polity, an event's polities, a scenario's ports…). */
  related: Array<{ kind: EncyclopediaType; title: string; record: string }>;
  sources: HistoricalSource[];
}

const EVIDENCE_MEANING: Record<EvidenceStatus, string> = {
  established: "widely accepted on documentary or archaeological evidence",
  scholarly_interpretation: "supported by evidence but dependent on historians' interpretation",
  reconstruction: "a reasonable reconstruction made to make the game playable; not a historical claim",
  uncertain: "disputed, incomplete or unverified",
  fictional: "a gameplay invention, not a historical claim",
};

export function evidenceMeaning(status: EvidenceStatus): string {
  return EVIDENCE_MEANING[status];
}

/** Keys that are pure gameplay tuning and would mislead a historical answer. */
const GAMEPLAY_KEYS = new Set(["infrastructure", "fee_modifier", "lane_nodes", "supplies", "demands", "default_access", "cargo_capacity", "cargo_unit", "max_speed_knots", "acceleration_knots_per_s", "deceleration_knots_per_s", "turn_rate_deg_per_s", "endurance_capacity", "consumption_per_day_at_max", "purchase_cost", "maintenance_per_day", "model", "min_sailing_angle_deg", "base_price", "cargo_space", "storage", "cost", "effects", "prerequisites", "effects_note", "starting_ships", "initial_treasury", "difficulty_treasury_multiplier", "objectives", "contract_margin", "base_port_fee", "fuel_price_per_unit", "fuel_unit_label", "features", "infrastructure_available", "ship_classes", "goods", "technologies", "starting_technologies", "available_ports", "initial_territories", "map_bounds", "wind", "rivals", "ai_polities", "playable_polities", "color", "related_records"]);

function serialise(record: object): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (GAMEPLAY_KEYS.has(key) || value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}: ${value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("; ")}`);
    } else if (typeof value === "object") {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  return lines.join("\n");
}

function findRecord(type: EncyclopediaType, id: string): { title: string; evidence: EvidenceStatus | null; sources: string[]; record: object; relatedIds: Array<{ kind: EncyclopediaType; id: string }> } | null {
  switch (type) {
    case "civilizations": {
      const c = ALL_CIVILIZATIONS.find((x) => x.id === id);
      if (!c) return null;
      const ports = ALL_PORTS.filter((p) => p.polity_id === c.id).map((p) => ({ kind: "ports" as const, id: p.id }));
      const events = ALL_EVENTS.filter((e) => e.involved_polities.includes(c.id)).map((e) => ({ kind: "events" as const, id: e.id }));
      return { title: c.canonical_name, evidence: c.evidence_status, sources: c.historical_sources, record: c, relatedIds: [...ports, ...events].slice(0, 8) };
    }
    case "scenarios": {
      const s = ALL_SCENARIOS.find((x) => x.id === id);
      if (!s) return null;
      const polities = s.ai_polities.map((p) => ({ kind: "civilizations" as const, id: p.polity_id }));
      const events = s.historical_events.map((e) => ({ kind: "events" as const, id: e }));
      return { title: s.title, evidence: s.evidence_status, sources: s.sources, record: s, relatedIds: [...polities, ...events].slice(0, 12) };
    }
    case "ports": {
      const p = ALL_PORTS.find((x) => x.id === id);
      if (!p) return null;
      const related: Array<{ kind: EncyclopediaType; id: string }> = [];
      if (p.polity_id) related.push({ kind: "civilizations", id: p.polity_id });
      for (const e of ALL_EVENTS) if (e.location.toLowerCase().includes(p.name.toLowerCase()) || e.effects.some((f) => "port_id" in f && f.port_id === p.id)) related.push({ kind: "events", id: e.id });
      return { title: p.name, evidence: p.evidence_status, sources: p.sources, record: p, relatedIds: related.slice(0, 8) };
    }
    case "ships": {
      const s = ALL_SHIPS.find((x) => x.id === id);
      return s ? { title: s.name_or_class, evidence: s.evidence_status, sources: s.sources, record: s, relatedIds: [] } : null;
    }
    case "goods": {
      const g = ALL_GOODS.find((x) => x.id === id);
      if (!g) return null;
      const suppliers = ALL_PORTS.filter((p) => p.supplies.includes(g.id)).map((p) => ({ kind: "ports" as const, id: p.id }));
      return { title: g.name, evidence: g.evidence_status, sources: g.sources, record: g, relatedIds: suppliers.slice(0, 6) };
    }
    case "technologies": {
      const t = ALL_TECHNOLOGIES.find((x) => x.id === id);
      return t ? { title: t.name, evidence: t.evidence_status, sources: t.sources, record: t, relatedIds: [] } : null;
    }
    case "events": {
      const e = ALL_EVENTS.find((x) => x.id === id);
      if (!e) return null;
      return { title: e.title, evidence: e.evidence_status, sources: e.sources, record: e, relatedIds: e.involved_polities.map((p) => ({ kind: "civilizations" as const, id: p })) };
    }
    case "figures": {
      const f = ALL_FIGURES.find((x) => x.id === id);
      return f ? { title: f.name, evidence: f.evidence_status, sources: f.sources, record: f, relatedIds: [] } : null;
    }
    case "routes": {
      const r = ALL_ROUTES.find((x) => x.id === id);
      return r ? { title: r.name, evidence: r.evidence_status, sources: r.sources, record: r, relatedIds: [] } : null;
    }
    case "sources": {
      const s = ALL_SOURCES.find((x) => x.id === id);
      return s ? { title: s.title, evidence: null, sources: [s.id], record: s, relatedIds: [] } : null;
    }
  }
}

function recordTitle(kind: EncyclopediaType, id: string): { title: string; record: object } | null {
  const found = findRecord(kind, id);
  return found ? { title: found.title, record: found.record } : null;
}

/** Everything the assistant is allowed to know about one entry. */
export function buildGrounding(type: string, id: string): GroundingMaterial | null {
  if (!isEncyclopediaType(type)) return null;
  const found = findRecord(type, id);
  if (!found) return null;
  const related = found.relatedIds
    .map((r) => {
      const rec = recordTitle(r.kind, r.id);
      return rec ? { kind: r.kind, title: rec.title, record: serialise(rec.record) } : null;
    })
    .filter((x): x is { kind: EncyclopediaType; title: string; record: string } => x !== null);
  const sources = found.sources.map((sid) => ALL_SOURCES.find((s) => s.id === sid)).filter((s): s is HistoricalSource => !!s);
  return { type, id, title: found.title, evidence: found.evidence, record: serialise(found.record), related, sources };
}

/** The system prompt: the rules, then the material. Stable per entry so repeated questions cache. */
export function groundingPrompt(material: GroundingMaterial): string {
  const sourceLines = material.sources.map((s) => `- [${s.id}] ${s.author_or_institution}${s.publication_year ? ` (${s.publication_year})` : ""}. ${s.title}. ${s.url_or_reference ?? ""}${s.notes ? ` Note: ${s.notes}` : ""}`).join("\n");
  const relatedText = material.related.map((r) => `### ${r.title} (${r.kind})\n${r.record}`).join("\n\n");
  return `You are the history assistant of Ocean Empire 3D, a maritime strategy game with an encyclopedia of historical records. You explain ONE encyclopedia entry to a player using only the material below.

Rules, in order of priority:
1. Use only the material in this prompt. Do not add dates, names, figures, causes or interpretations from elsewhere, even if you believe you know them. If the material does not cover a question, say plainly that this entry does not record it and point the player to the listed sources or to the relevant encyclopedia section.
2. Distinguish supported facts from uncertainty. The entry's evidence rating is "${material.evidence ?? "none"}"${material.evidence ? ` (${evidenceMeaning(material.evidence)})` : ""}. Say when something is an interpretation, a reconstruction, uncertain or fictional. Gameplay values (prices, speeds, fees, capacities) are abstractions and must never be presented as historical fact.
3. When you state something, name the source it rests on using the bracketed id, for example [src_hourani]. Never invent a source.
4. Be concise: a short paragraph or a few bullet points. Write in plain English. Do not use headers.
5. If asked about anything other than this entry's history, answer briefly from the material if it is covered, otherwise decline and suggest where in the encyclopedia to look.

## Entry: ${material.title} (${material.type})
${material.record}

## Related records
${relatedText || "(none)"}

## Sources available for this entry
${sourceLines || "(none listed)"}`;
}
