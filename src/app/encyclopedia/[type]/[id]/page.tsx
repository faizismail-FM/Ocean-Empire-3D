import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_CIVILIZATIONS, ALL_EVENTS, ALL_FIGURES, ALL_GOODS, ALL_PORTS, ALL_ROUTES, ALL_SCENARIOS, ALL_SHIPS, ALL_SOURCES, ALL_TECHNOLOGIES, getCivilization } from "@/data";
import { formatCoordinate } from "@/engine/geo";
import { formatYear } from "@/engine/calendar";
import { ENCYCLOPEDIA_TYPES, isEncyclopediaType, listEntries, recordsCiting } from "@/lib/encyclopedia";
import { Badge, EvidenceBadge, KeyValue } from "@/components/ui";
import { SourceList } from "@/components/game/SourceList";
import { HistoryAssistant } from "@/components/game/HistoryAssistant";

export function generateStaticParams() {
  return ENCYCLOPEDIA_TYPES.flatMap((t) => listEntries(t.id).map((e) => ({ type: t.id, id: e.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }): Promise<Metadata> {
  const { type, id } = await params;
  if (!isEncyclopediaType(type)) return { title: "Encyclopedia" };
  const entry = listEntries(type).find((e) => e.id === id);
  return { title: entry ? entry.title : "Encyclopedia" };
}

export default async function EntryPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!isEncyclopediaType(type)) notFound();
  const entry = listEntries(type).find((e) => e.id === id);
  if (!entry) notFound();
  const meta = ENCYCLOPEDIA_TYPES.find((t) => t.id === type)!;

  return (
    <article className="max-w-3xl">
      <Link href={`/encyclopedia/${type}`} className="text-xs text-foam/50 hover:text-foam">← {meta.label}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{entry.title}</h1>
        {entry.evidence && <EvidenceBadge status={entry.evidence} />}
      </div>
      <p className="mt-1 text-foam/60">{entry.subtitle}</p>
      <div className="mt-6 space-y-6">
        <Body type={type} id={id} />
        {type !== "sources" && <HistoryAssistant type={type} id={id} title={entry.title} />}
        {type !== "sources" && (
          <section>
            <h2 className="text-xl">Sources</h2>
            <div className="mt-2">
              <SourceList ids={entry.sources} />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-foam/80">{children}</div>
    </section>
  );
}

function Body({ type, id }: { type: string; id: string }) {
  switch (type) {
    case "civilizations": {
      const c = ALL_CIVILIZATIONS.find((x) => x.id === id)!;
      const ports = ALL_PORTS.filter((p) => p.polity_id === c.id);
      return (
        <>
          <KeyValue items={[["Also known as", c.historical_names.join(", ") || "—"], ["Dates", `${formatYear(c.start_date)} – ${c.end_date ? formatYear(c.end_date) : "present"}${c.dates_approximate ? " (approximate)" : ""}`], ["Region", c.region], ["Scenario family", c.family ?? "—"]]} />
          <Section title="Political context">{c.political_context}</Section>
          <Section title="Maritime role">{c.description}</Section>
          {ports.length > 0 && (
            <Section title="Ports in the database">
              <div className="flex flex-wrap gap-1">{ports.map((p) => <Link key={p.id} href={`/encyclopedia/ports/${p.id}`}><Badge tone="cyan">{p.name}</Badge></Link>)}</div>
            </Section>
          )}
          {c.approximate_region && <p className="text-xs text-gold-300/80">The map shows an approximate influence region for labelling only; precise historical borders for this period are not available.</p>}
        </>
      );
    }
    case "scenarios": {
      const s = ALL_SCENARIOS.find((x) => x.id === id)!;
      return (
        <>
          <KeyValue items={[["Mode", s.mode], ["Period", `${s.start_date} to ${s.end_date}`], ["Region", s.region], ["Player entity", s.player_entity_note]]} />
          <Section title="Summary">{s.summary}</Section>
          <Section title="Historical background">{s.historical_background}</Section>
          <Section title="Uncertainty">{s.uncertainty_note}</Section>
          <Section title="Objectives">
            <ul className="list-disc space-y-1 pl-5">{s.objectives.map((o) => <li key={o.id}>{o.title} <Badge tone={o.historical_basis === "documented" ? "green" : o.historical_basis === "inspired" ? "gold" : "purple"}>{o.historical_basis}</Badge></li>)}</ul>
          </Section>
          <Section title="Events in this campaign">
            <div className="flex flex-wrap gap-1">{s.historical_events.map((e) => { const ev = ALL_EVENTS.find((x) => x.id === e); return ev ? <Link key={e} href={`/encyclopedia/events/${e}`}><Badge tone="neutral">{ev.date_or_date_range.start}: {ev.title}</Badge></Link> : null; })}</div>
          </Section>
          <Link href="/encyclopedia/maps" className="text-sm text-cyan-300 hover:underline">View the historical map for this period →</Link>
        </>
      );
    }
    case "ports": {
      const p = ALL_PORTS.find((x) => x.id === id)!;
      const polity = p.polity_id ? getCivilization(p.polity_id) : null;
      const goods = (ids: string[]) => ids.map((g) => ALL_GOODS.find((x) => x.id === g)).filter(Boolean) as typeof ALL_GOODS;
      return (
        <>
          <KeyValue
            items={[
              ["Modern reference", p.modern_reference_name ?? "—"],
              ["Historical names", p.historical_names.join(", ") || "—"],
              ["Coordinates", `${formatCoordinate({ lat: p.latitude, lon: p.longitude })} (${p.location_certainty})`],
              ["Active period", `${formatYear(p.active_period.start)} – ${p.active_period.end ? formatYear(p.active_period.end) : "present"}${p.active_period.note ? ` · ${p.active_period.note}` : ""}`],
              ["Authority", polity ? <Link href={`/encyclopedia/civilizations/${polity.id}`} className="text-cyan-300 hover:underline">{p.historical_polity}</Link> : p.historical_polity],
              ["Country today", p.country ?? "—"],
            ]}
          />
          <Section title="Significance">{p.historical_significance}{p.notes && <p className="mt-2 text-gold-300/80">{p.notes}</p>}</Section>
          <Section title="Trade">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><div className="label-caps mb-1">Supplies</div><div className="flex flex-wrap gap-1">{goods(p.supplies).map((g) => <Link key={g.id} href={`/encyclopedia/goods/${g.id}`}><Badge tone="green">{g.name}</Badge></Link>)}</div></div>
              <div><div className="label-caps mb-1">Demands</div><div className="flex flex-wrap gap-1">{goods(p.demands).map((g) => <Link key={g.id} href={`/encyclopedia/goods/${g.id}`}><Badge tone="cyan">{g.name}</Badge></Link>)}</div></div>
            </div>
            <p className="mt-2 text-xs text-foam/50">Supply and demand lists are gameplay abstractions informed by the sources.</p>
          </Section>
        </>
      );
    }
    case "ships": {
      const s = ALL_SHIPS.find((x) => x.id === id)!;
      return (
        <>
          <KeyValue
            items={[
              ["Type", s.vessel_type],
              ["Tradition / region", s.civilization_or_region],
              ["Documented", `${s.earliest_documented_period ? formatYear(s.earliest_documented_period) : "?"} – ${s.latest_documented_period ? formatYear(s.latest_documented_period) : "present"}`],
              ["Propulsion", s.propulsion],
              ["Game length", `${s.length_m} m`],
              ["Game capacity", `${s.cargo_capacity} ${s.cargo_unit}`],
              ["Game speed", `${s.max_speed_knots} kn max`],
            ]}
          />
          <Section title="Capabilities">{s.capabilities}</Section>
          <Section title="Historical notes">{s.historical_notes}</Section>
          <p className="text-xs text-gold-300/80">{s.balance_note}</p>
        </>
      );
    }
    case "goods": {
      const g = ALL_GOODS.find((x) => x.id === id)!;
      const supplied = ALL_PORTS.filter((p) => p.supplies.includes(g.id));
      return (
        <>
          <KeyValue items={[["Category", g.category], ["Historical availability", g.historical_availability ? `${formatYear(g.historical_availability.start)} – ${g.historical_availability.end ? formatYear(g.historical_availability.end) : "present"}` : "—"], ["Storage", g.storage], ["Game base price", `${g.base_price} per unit (abstraction)`]]} />
          <Section title="Description">{g.description}{g.trade_restrictions && <p className="mt-2 text-gold-300/80">{g.trade_restrictions}</p>}</Section>
          {supplied.length > 0 && <Section title="Supplied at"><div className="flex flex-wrap gap-1">{supplied.map((p) => <Link key={p.id} href={`/encyclopedia/ports/${p.id}`}><Badge tone="green">{p.name} ({p.active_period.start})</Badge></Link>)}</div></Section>}
        </>
      );
    }
    case "technologies": {
      const t = ALL_TECHNOLOGIES.find((x) => x.id === id)!;
      const scenarios = ALL_SCENARIOS.filter((s) => s.technologies.includes(t.id));
      return (
        <>
          <KeyValue items={[["Branch", t.branch.replace("_", " ")], ["Available in", scenarios.map((s) => s.title).join(", ")], ["Prerequisites", t.prerequisites.map((p) => ALL_TECHNOLOGIES.find((x) => x.id === p)?.name ?? p).join(", ") || "none"], ["Game cost", `${t.cost} (abstraction)`]]} />
          <Section title="Description">{t.description}</Section>
          <Section title="Historical notes">{t.historical_notes}</Section>
        </>
      );
    }
    case "events": {
      const e = ALL_EVENTS.find((x) => x.id === id)!;
      return (
        <>
          <KeyValue items={[["Date", `${formatYear(e.date_or_date_range.start)}${e.date_or_date_range.end && e.date_or_date_range.end !== e.date_or_date_range.start ? ` – ${formatYear(e.date_or_date_range.end)}` : ""}${e.date_or_date_range.approximate ? " (approximate)" : ""}`], ["Location", e.location], ["Polities", e.involved_polities.map((p) => getCivilization(p)?.canonical_name ?? p).join(", ")]]} />
          {e.date_or_date_range.note && <p className="text-xs text-gold-300/80">{e.date_or_date_range.note}</p>}
          <Section title="Summary">{e.summary}</Section>
          <Section title="Significance">{e.historical_significance}</Section>
          {e.effects.length > 0 && e.effects[0]?.type !== "notice" && (
            <Section title="In the game">
              <p>This event has simulated consequences in the campaign. {e.effects_note}</p>
            </Section>
          )}
        </>
      );
    }
    case "figures": {
      const f = ALL_FIGURES.find((x) => x.id === id)!;
      return (
        <>
          <KeyValue items={[["Also", f.alternate_names.join(", ") || "—"], ["Role", f.role], ["Active", `${formatYear(f.period.start)} – ${f.period.end ? formatYear(f.period.end) : "?"}${f.period.approximate ? " (approximate)" : ""}`], ["Polity", f.polity_id ? getCivilization(f.polity_id)?.canonical_name ?? f.polity_id : "—"]]} />
          <Section title="Summary">{f.summary}</Section>
        </>
      );
    }
    case "routes": {
      const r = ALL_ROUTES.find((x) => x.id === id)!;
      return (
        <>
          <KeyValue items={[["Period", `${formatYear(r.period.start)} – ${r.period.end ? formatYear(r.period.end) : "present"}`], ["Waypoints", `${r.waypoints.length} (approximate positions)`]]} />
          <Section title="Description">{r.description}</Section>
          <Link href="/encyclopedia/maps" className="text-sm text-cyan-300 hover:underline">View on the historical map →</Link>
        </>
      );
    }
    case "sources": {
      const s = ALL_SOURCES.find((x) => x.id === id)!;
      const citing = recordsCiting(s.id);
      return (
        <>
          <KeyValue items={[["Author / institution", s.author_or_institution], ["Year", s.publication_year ?? "—"], ["Type", s.source_type.replace("_", " ")], ["Reference", s.url_or_reference?.startsWith("http") ? <a href={s.url_or_reference} className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer">{s.url_or_reference}</a> : s.url_or_reference ?? "—"]]} />
          {s.notes && <p className="text-sm text-gold-300/80">{s.notes}</p>}
          <Section title="Records citing this source">
            <ul className="grid gap-1 sm:grid-cols-2">{citing.map((e) => <li key={`${e.type}-${e.id}`}><Link href={`/encyclopedia/${e.type}/${e.id}`} className="text-cyan-300 hover:underline">{e.title}</Link> <span className="text-xs text-foam/50">({e.type})</span></li>)}</ul>
          </Section>
        </>
      );
    }
    default:
      return null;
  }
}
