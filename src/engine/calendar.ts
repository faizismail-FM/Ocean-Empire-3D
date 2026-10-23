/**
 * Calendar helpers for the simulation clock. Dates are stored as simple
 * {year, month, day} records so that medieval years (e.g. 850 CE) work the same way
 * as modern ones. The proleptic Gregorian calendar is used throughout: good enough
 * for gameplay, and never presented as a historically exact date conversion.
 */

export interface GameDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export const SECONDS_PER_DAY = 86400;

function toUtc(d: GameDate): Date {
  const dt = new Date(Date.UTC(2000, d.month - 1, d.day));
  dt.setUTCFullYear(d.year);
  return dt;
}

function fromUtc(dt: Date): GameDate {
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

export function addDays(date: GameDate, days: number): GameDate {
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + Math.floor(days));
  return fromUtc(dt);
}

export function addSeconds(date: GameDate, seconds: number): GameDate {
  return addDays(date, Math.floor(seconds / SECONDS_PER_DAY));
}

/** Whole days between two dates (b - a). */
export function daysBetween(a: GameDate, b: GameDate): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / (SECONDS_PER_DAY * 1000));
}

export function compareDates(a: GameDate, b: GameDate): number {
  return toUtc(a).getTime() - toUtc(b).getTime();
}

export function isBefore(a: GameDate, b: GameDate): boolean {
  return compareDates(a, b) < 0;
}

export function isSameOrAfter(a: GameDate, b: GameDate): boolean {
  return compareDates(a, b) >= 0;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatGameDate(d: GameDate, options: { era?: boolean } = {}): string {
  const month = MONTHS[d.month - 1] ?? "";
  const yearLabel = options.era === false ? `${d.year}` : d.year < 1600 ? `${d.year} CE` : `${d.year}`;
  return `${d.day} ${month} ${yearLabel}`;
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year < 1600) return `${year} CE`;
  return `${year}`;
}

export function dateFromIso(iso: string): GameDate {
  const match = /^(-?\d{1,4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Clock time within the day as HH:MM, derived from simulation seconds. */
export function formatClock(simSeconds: number): string {
  const secondsIntoDay = ((simSeconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const h = Math.floor(secondsIntoDay / 3600);
  const m = Math.floor((secondsIntoDay % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / SECONDS_PER_DAY);
  const hours = Math.floor((seconds % SECONDS_PER_DAY) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
