"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircleQuestion, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";

interface Turn {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: string; title: string }>;
}

const SUGGESTIONS: Record<string, string[]> = {
  ports: ["How sure are we about where this port was?", "What did it trade, according to the sources?", "What happened here during the campaign period?"],
  events: ["What is the evidence for this event?", "What did it change for merchants?", "Which parts of this are interpretation?"],
  ships: ["What survives of this kind of ship?", "Which parts of this entry are reconstruction?"],
  civilizations: ["How did this polity treat foreign merchants?", "What is uncertain about its dates?"],
  figures: ["What do we actually know about this person?", "Which sources mention them?"],
  goods: ["Where did this good come from and who wanted it?"],
  technologies: ["Is this practice documented for the period?"],
  routes: ["Which sources describe this route?"],
  scenarios: ["What is historical here and what is invented for the game?"],
};

/**
 * Question box for one encyclopedia entry. Answers come from the server route, which
 * grounds the model in the entry's record and bibliography only. When the deployment has
 * no API key the component explains that and shows nothing else.
 */
export function HistoryAssistant({ type, id, title }: { type: string; id: string; title: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/history-assistant")
      .then((r) => r.json())
      .then((d: { available: boolean }) => {
        if (!cancelled) setAvailable(Boolean(d.available));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ask = async (text: string) => {
    const q = text.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setQuestion("");
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    try {
      const res = await fetch("/api/history-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id, question: q, history }) });
      const data = (await res.json()) as { answer?: string; sources?: Array<{ id: string; title: string }>; error?: string };
      if (!res.ok || !data.answer) {
        setError(data.error ?? "The assistant could not answer.");
        setTurns((prev) => prev.slice(0, -1));
      } else {
        setTurns((prev) => [...prev, { role: "assistant", content: data.answer!, sources: data.sources ?? [] }]);
      }
    } catch {
      setError("Could not reach the assistant.");
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  if (available === null) return null;
  if (!available) {
    return (
      <section className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-foam/55">
        <span className="flex items-center gap-2"><MessageCircleQuestion size={14} /> The history assistant is not enabled on this deployment. Everything on this page comes from the sources listed below.</span>
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl"><Sparkles size={18} className="text-gold-300" /> Ask about this entry</h2>
        <Badge tone="purple">AI assistant</Badge>
      </div>
      <p className="mt-1 text-xs text-foam/55">
        Answers are generated from this entry&apos;s record and its listed sources only, and the assistant is told to say when the record does not cover a question and to label interpretation, reconstruction and fiction. Check the sources before relying on a detail.
      </p>

      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(SUGGESTIONS[type] ?? SUGGESTIONS.ports)!.map((s) => (
            <button key={s} onClick={() => void ask(s)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-foam/70 hover:border-cyan-300/40 hover:text-foam">
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mt-3 space-y-2">
          {turns.map((t, i) => (
            <div key={i} className={cn("rounded-lg px-3 py-2 text-sm", t.role === "user" ? "bg-cyan-400/10 text-foam" : "bg-white/5 text-foam/85")}>
              {t.content.split(/\n+/).map((para, j) => (
                <p key={j} className={j > 0 ? "mt-1.5" : undefined}>{para}</p>
              ))}
              {t.sources && t.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.sources.map((s) => (
                    <Link key={s.id} href={`/encyclopedia/sources/${s.id}`} className="rounded-md bg-navy-950/50 px-1.5 py-0.5 text-[0.68rem] text-cyan-300 hover:underline" title={s.title}>
                      {s.id}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="rounded-lg bg-white/5 px-3 py-2 text-sm text-foam/50">Reading the record…</div>}
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={`Ask about ${title}…`} maxLength={500} className="min-w-0 flex-1" aria-label="Question for the history assistant" disabled={busy} />
        <Button size="sm" type="submit" disabled={busy || question.trim().length < 3}>
          <Send size={14} /> Ask
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-coral-400">{error}</p>}
    </section>
  );
}
