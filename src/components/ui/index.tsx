"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { EvidenceStatus } from "@/data/schemas";

/* Small, dependency-free UI primitives shared across the game. */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-cyan-400/90 text-navy-950 hover:bg-cyan-300 disabled:bg-cyan-400/30 disabled:text-navy-900/60 font-semibold",
  secondary: "bg-navy-700/80 text-foam border border-cyan-300/20 hover:border-cyan-300/50 hover:bg-navy-600/80 disabled:opacity-40",
  ghost: "bg-transparent text-foam/80 hover:bg-white/5 hover:text-foam disabled:opacity-40",
  danger: "bg-coral-400/15 text-coral-400 border border-coral-400/40 hover:bg-coral-400/25 disabled:opacity-40",
  gold: "bg-gold-400/90 text-navy-950 hover:bg-gold-300 disabled:bg-gold-400/30 font-semibold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-3.5 py-2 rounded-lg gap-2",
  lg: "text-base px-5 py-3 rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn("inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed select-none", variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center transition-colors select-none", variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </Link>
  );
}

export function Panel({ title, subtitle, actions, className, children, padded = true }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode; padded?: boolean }) {
  return (
    <section className={cn("panel", padded && "p-4 md:p-5", className)}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg text-foam">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-foam/60">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, accent, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; accent?: "cyan" | "gold" | "coral" | "none"; className?: string }) {
  const color = accent === "gold" ? "text-gold-300" : accent === "coral" ? "text-coral-400" : accent === "none" ? "text-foam" : "text-cyan-300";
  return (
    <div className={cn("panel-soft px-3 py-2.5", className)}>
      <div className="label-caps">{label}</div>
      <div className={cn("mt-0.5 font-mono text-lg leading-tight", color)}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-foam/50">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className, title }: { children: ReactNode; tone?: "neutral" | "cyan" | "gold" | "green" | "coral" | "purple"; className?: string; title?: string }) {
  const tones = {
    neutral: "bg-white/8 text-foam/70 border-white/10",
    cyan: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
    gold: "bg-gold-400/15 text-gold-300 border-gold-400/30",
    green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    coral: "bg-coral-400/15 text-coral-400 border-coral-400/30",
    purple: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  };
  return (
    <span title={title} className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-wider", tones[tone], className)}>
      {children}
    </span>
  );
}

const EVIDENCE_LABEL: Record<EvidenceStatus, { label: string; tone: "green" | "cyan" | "gold" | "coral" | "purple"; title: string }> = {
  established: { label: "Established", tone: "green", title: "Widely accepted on documentary or archaeological evidence." },
  scholarly_interpretation: { label: "Interpretation", tone: "cyan", title: "Supported by evidence but dependent on scholarly interpretation." },
  reconstruction: { label: "Reconstruction", tone: "gold", title: "A reasonable reconstruction made to fill a gameplay need." },
  uncertain: { label: "Uncertain", tone: "coral", title: "Disputed, incomplete or unverified; further research needed." },
  fictional: { label: "Fictional", tone: "purple", title: "A gameplay invention, not a historical claim." },
};

export function EvidenceBadge({ status, className }: { status: EvidenceStatus; className?: string }) {
  const meta = EVIDENCE_LABEL[status];
  return (
    <Badge tone={meta.tone} title={meta.title} className={className}>
      {meta.label}
    </Badge>
  );
}

export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="purple" title="This value is produced by the game simulation, not measured from the real world." className={className}>
      Simulated
    </Badge>
  );
}

export function Modal({ open, onClose, title, children, width = "max-w-xl", dismissible = true }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: string; dismissible?: boolean }) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose, dismissible]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} role="dialog" aria-modal="true">
      <div className={cn("panel w-full animate-fade-up p-5 md:p-6", width)} onClick={(e) => e.stopPropagation()}>
        {(title || dismissible) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? <h2 className="text-2xl">{title}</h2> : <span />}
            {dismissible && (
              <button onClick={onClose} className="rounded-md p-1 text-foam/60 hover:bg-white/10 hover:text-foam" aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onCancel, onConfirm, title, message, confirmLabel = "Confirm", danger }: { open: boolean; onCancel: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-md">
      <div className="text-sm text-foam/80">{message}</div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function ProgressBar({ value, max, className, tone = "cyan" }: { value: number; max: number; className?: string; tone?: "cyan" | "gold" | "coral" | "green" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const colors = { cyan: "bg-cyan-400", gold: "bg-gold-400", coral: "bg-coral-400", green: "bg-emerald-400" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: Array<{ id: T; label: ReactNode; disabled?: boolean }>; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1 rounded-lg bg-navy-950/50 p-1", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === value}
          disabled={t.disabled}
          onClick={() => onChange(t.id)}
          className={cn("rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-40", t.id === value ? "bg-cyan-400/20 text-cyan-300" : "text-foam/70 hover:bg-white/5 hover:text-foam")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel-soft flex flex-col items-center justify-center px-6 py-10 text-center">
      <h4 className="text-lg text-foam/90">{title}</h4>
      {message && <p className="mt-1 max-w-md text-sm text-foam/60">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KeyValue({ items, className }: { items: Array<[ReactNode, ReactNode]>; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-foam/55">{k}</dt>
          <dd className="text-foam/90">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
