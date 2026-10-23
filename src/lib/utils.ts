export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function formatMoney(amount: number, currency: { symbol: string; code: string }): string {
  const abs = Math.abs(amount);
  let text: string;
  if (abs >= 1_000_000_000) text = `${(abs / 1_000_000_000).toFixed(2)}B`;
  else if (abs >= 1_000_000) text = `${(abs / 1_000_000).toFixed(2)}M`;
  else if (abs >= 10_000) text = `${(abs / 1_000).toFixed(1)}k`;
  else text = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return `${amount < 0 ? "-" : ""}${currency.symbol}${text}`;
}

export function formatMoneyExact(amount: number, currency: { symbol: string; code: string }): string {
  return `${amount < 0 ? "-" : ""}${currency.symbol}${Math.abs(Math.round(amount)).toLocaleString("en-US")}`;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function uid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
