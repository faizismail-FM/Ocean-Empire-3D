"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpenText, HelpCircle, Lightbulb, X } from "lucide-react";
import { GUIDE, guideSection, type GuideSection, type GuideSectionId } from "@/content/guide";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

/** Sections that apply to the current scenario (technology and diplomacy are optional features). */
export function useGuideSections(): GuideSection[] {
  const features = useGameStore((s) => s.catalog?.scenario.features);
  return GUIDE.filter((s) => !s.feature || !features || features[s.feature]);
}

function SectionBody({ section, compact = false }: { section: GuideSection; compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact ? "text-sm" : "text-[0.95rem]")}>
      <ul className="space-y-2 text-foam/80">
        {section.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {section.controls && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-navy-950/50 p-3 text-sm">
          {section.controls.map((c) => (
            <div key={c.keys} className="contents">
              <dt className="font-mono text-cyan-300">{c.keys}</dt>
              <dd className="text-foam/75">{c.action}</dd>
            </div>
          ))}
        </dl>
      )}
      {section.tips?.map((t) => (
        <div key={t} className="flex gap-2 rounded-lg border border-gold-400/30 bg-gold-400/10 p-3 text-sm text-foam/85">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold-300" />
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

/** The full guide: a sticky index beside every section. Used by /guide and the overlay. */
export function GuideContent({ sections, initial, embedded = false }: { sections: GuideSection[]; initial?: GuideSectionId; embedded?: boolean }) {
  const [seen, setSeen] = useState<GuideSectionId | null>(null);
  const active: GuideSectionId = seen ?? initial ?? sections[0]!.id;
  const refs = useRef<Partial<Record<GuideSectionId, HTMLElement | null>>>({});
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initial) return;
    refs.current[initial]?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [initial]);

  // Scroll spy: highlight the section nearest the top of the viewport (or the overlay's scroller).
  useEffect(() => {
    const root = embedded ? scroller.current : null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0]?.target.id.replace(/^guide-/, "");
        if (first && sections.some((s) => s.id === first)) setSeen(first as GuideSectionId);
      },
      { root, rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );
    for (const s of sections) {
      const el = refs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections, embedded]);

  const jump = (id: GuideSectionId) => {
    setSeen(id);
    refs.current[id]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div className={cn("grid gap-6", embedded ? "h-full min-h-0 grid-cols-1 md:grid-cols-[200px_1fr]" : "md:grid-cols-[220px_1fr]")}>
      <nav className={cn("self-start", embedded ? "hidden md:block" : "md:sticky md:top-24")} aria-label="Guide sections">
        <ol className="space-y-0.5 text-sm">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button onClick={() => jump(s.id)} className={cn("flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left transition-colors", active === s.id ? "bg-cyan-400/15 text-cyan-300" : "text-foam/65 hover:bg-white/5 hover:text-foam")}>
                <span className="w-4 shrink-0 font-mono text-xs text-foam/40">{i + 1}</span>
                <span>{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div ref={scroller} className={cn("min-w-0", embedded && "min-h-0 overflow-y-auto pr-1")}>
        {embedded && (
          <div className="mb-4 flex flex-wrap gap-1 md:hidden">
            {sections.map((s) => (
              <button key={s.id} onClick={() => jump(s.id)} className="rounded-md bg-white/5 px-2 py-1 text-xs text-foam/70">
                {s.title}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-8">
          {sections.map((s) => (
            <section
              key={s.id}
              id={`guide-${s.id}`}
              ref={(el) => {
                refs.current[s.id] = el;
              }}
              className="scroll-mt-24"
            >
              <h2 className="text-2xl">{s.title}</h2>
              <p className="mt-1 text-foam/60">{s.summary}</p>
              <div className="mt-3">
                <SectionBody section={s} compact={embedded} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full-screen guide for the sailing view, so the player never has to leave the scene. */
export function GuideOverlay({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: GuideSectionId }) {
  const sections = useGuideSections();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-navy-950/75 p-3 backdrop-blur-sm md:p-8" onClick={onClose} role="dialog" aria-modal="true" aria-label="Game guide">
      <div className="panel flex h-full w-full max-w-5xl flex-col p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl">
            <BookOpenText size={22} className="text-gold-300" /> How to play
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/guide" className="hidden text-sm text-cyan-300 hover:underline sm:inline">
              Open as a page
            </Link>
            <button onClick={onClose} className="rounded-md p-1.5 text-foam/60 hover:bg-white/10 hover:text-foam" aria-label="Close guide">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <GuideContent sections={sections} initial={initial} embedded />
        </div>
        <p className="mt-3 text-xs text-foam/45">The simulation keeps running behind this guide unless it is paused.</p>
      </div>
    </div>
  );
}

/**
 * A small "?" that opens the relevant guide section in a popover. Placed next to screen
 * titles so help is one click away wherever the player is.
 */
export function HelpTip({ section, align = "left", children }: { section: GuideSectionId; align?: "left" | "right"; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = guideSection(section);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors", open ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-300" : "border-white/10 text-foam/50 hover:border-cyan-300/40 hover:text-cyan-300")}
        aria-label={`Help: ${s.title}`}
        aria-expanded={open}
        title={`Help: ${s.title}`}
      >
        {children ?? <HelpCircle size={15} />}
      </button>
      {open && (
        <div className={cn("panel absolute top-full z-40 mt-2 w-[min(92vw,26rem)] p-4 text-left", align === "right" ? "right-0" : "left-0")} role="dialog">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label-caps text-gold-300">Guide</div>
              <h3 className="mt-0.5 text-lg leading-tight">{s.title}</h3>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-foam/50 hover:bg-white/10 hover:text-foam" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-sm text-foam/75">{s.summary}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-foam/80">
            {s.points.slice(0, 3).map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link href={`/guide#guide-${s.id}`} className="mt-3 inline-block text-sm text-cyan-300 hover:underline" onClick={() => setOpen(false)}>
            Read the full guide →
          </Link>
        </div>
      )}
    </div>
  );
}
