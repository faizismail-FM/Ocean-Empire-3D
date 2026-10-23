import type { WindRegime } from "@/data/schemas";
import { headingDifference } from "./geo";
import { clamp } from "@/lib/utils";

export interface Wind {
  /** Direction the wind blows FROM, degrees. */
  from: number;
  speed_knots: number;
}

/** Seasonal wind for a month, interpolated toward the next month by day of month. */
export function windForDate(regime: WindRegime | null, month: number, day: number): Wind {
  if (!regime) return { from: 0, speed_knots: 0 };
  const a = regime.monthly[(month - 1) % 12];
  const b = regime.monthly[month % 12];
  if (!a || !b) return { from: 0, speed_knots: 0 };
  const t = clamp((day - 1) / 30, 0, 1);
  const diff = headingDifference(a[0], b[0]);
  const from = (a[0] + diff * t + 360) % 360;
  const speed = a[1] + (b[1] - a[1]) * t;
  return { from, speed_knots: speed };
}

/**
 * Fraction of a sailing vessel's maximum speed available on a heading, given the wind.
 * Simplified polar: nothing inside the no-sail cone, best on a broad reach, slightly
 * less dead downwind. Light winds scale everything down; strong winds give a small bonus.
 */
export function sailEfficiency(heading: number, wind: Wind, minSailingAngle: number): number {
  if (wind.speed_knots <= 0) return 0.25; // drifting with oars / current: minimal way
  const angleOffWind = Math.abs(headingDifference(wind.from, heading)); // 0 = into wind, 180 = downwind
  let polar: number;
  if (angleOffWind < minSailingAngle) {
    polar = 0.08; // in irons: barely steerable
  } else if (angleOffWind < 90) {
    polar = 0.45 + ((angleOffWind - minSailingAngle) / (90 - minSailingAngle)) * 0.4;
  } else if (angleOffWind < 140) {
    polar = 0.85 + ((angleOffWind - 90) / 50) * 0.15;
  } else {
    polar = 1 - ((angleOffWind - 140) / 40) * 0.12;
  }
  const windFactor = clamp(0.35 + wind.speed_knots / 22, 0.35, 1.15);
  return clamp(polar * windFactor, 0.05, 1.15);
}

export function isInIrons(heading: number, wind: Wind, minSailingAngle: number): boolean {
  if (wind.speed_knots <= 0) return false;
  return Math.abs(headingDifference(wind.from, heading)) < minSailingAngle;
}
