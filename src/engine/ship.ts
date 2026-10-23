import type { VesselClass } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { destinationPoint, normalizeHeading, type GeoPoint } from "./geo";
import { sailEfficiency, type Wind } from "./wind";

/**
 * Vessel kinematics. Pure functions over a small kinematic record so the simulation and
 * the tests can step ships without the full game state.
 */

export interface Kinematics {
  position: GeoPoint;
  heading: number;
  speed_knots: number;
  throttle: number;
  rudder: number;
}

export interface HandlingModifiers {
  speed_multiplier: number;
  consumption_multiplier: number;
}

export interface StepResult {
  kinematics: Kinematics;
  distance_nm: number;
  /** Fuel tonnes (engine) or provision-days (sail) consumed during the step. */
  endurance_used: number;
  sail_efficiency: number | null;
}

export const DEFAULT_MODIFIERS: HandlingModifiers = { speed_multiplier: 1, consumption_multiplier: 1 };

/** Degrees per second the ship can turn at full rudder at a given speed. */
export function maxTurnRate(cls: VesselClass, speedKnots: number): number {
  const speedFactor = clamp(speedKnots / (cls.max_speed_knots * 0.5), 0.05, 1);
  return cls.turn_rate_deg_per_s * speedFactor;
}

/** Target speed in knots for the current throttle, wind and modifiers. */
export function targetSpeed(cls: VesselClass, k: Kinematics, wind: Wind | null, mods: HandlingModifiers, enduranceEmpty: boolean): { speed: number; sailEff: number | null } {
  const maxSpeed = cls.max_speed_knots * mods.speed_multiplier;
  if (cls.propulsion === "engine") {
    if (enduranceEmpty) return { speed: 0, sailEff: null };
    return { speed: maxSpeed * clamp(k.throttle, 0, 1), sailEff: null };
  }
  const eff = wind ? sailEfficiency(k.heading, wind, cls.min_sailing_angle_deg ?? 60) : 0.6;
  // Out of provisions: a hungry crew works the ship poorly.
  const crewFactor = enduranceEmpty ? 0.5 : 1;
  return { speed: maxSpeed * clamp(k.throttle, 0, 1) * eff * crewFactor, sailEff: eff };
}

/**
 * Advance a ship by `dt` simulation seconds. Acceleration is capped by the class values so
 * that speed changes gradually; turn rate scales with speed (a stationary ship cannot turn).
 */
export function stepKinematics(
  cls: VesselClass,
  k: Kinematics,
  dt: number,
  wind: Wind | null,
  mods: HandlingModifiers = DEFAULT_MODIFIERS,
  enduranceEmpty = false,
): StepResult {
  if (dt <= 0) return { kinematics: { ...k }, distance_nm: 0, endurance_used: 0, sail_efficiency: null };
  const { speed: desired, sailEff } = targetSpeed(cls, k, wind, mods, enduranceEmpty);

  let speed = k.speed_knots;
  if (desired > speed) speed = Math.min(desired, speed + cls.acceleration_knots_per_s * dt);
  else speed = Math.max(desired, speed - cls.deceleration_knots_per_s * dt);
  speed = clamp(speed, 0, cls.max_speed_knots * mods.speed_multiplier * 1.15);

  // Rudder authority grows with speed; near-stationary ships barely steer.
  const turn = k.rudder * maxTurnRate(cls, speed) * dt;
  const heading = normalizeHeading(k.heading + turn);

  const avgSpeed = (k.speed_knots + speed) / 2;
  const distance = (avgSpeed * dt) / 3600; // nm
  const position = distance > 0 ? destinationPoint(k.position, heading, distance) : { ...k.position };

  let enduranceUsed: number;
  if (cls.propulsion === "engine") {
    // Cube law: fuel burn rises steeply with speed; idling costs a little.
    const ratio = cls.max_speed_knots > 0 ? avgSpeed / cls.max_speed_knots : 0;
    const perDay = cls.consumption_per_day_at_max * (0.05 + 0.95 * ratio ** 3) * mods.consumption_multiplier;
    enduranceUsed = (perDay * dt) / 86400;
  } else {
    enduranceUsed = (dt / 86400) * mods.consumption_multiplier; // one provision-day per day at sea
  }

  return {
    kinematics: { position, heading, speed_knots: speed, throttle: k.throttle, rudder: k.rudder },
    distance_nm: distance,
    endurance_used: enduranceUsed,
    sail_efficiency: sailEff,
  };
}

/** Estimated sustained cruise speed used for ETAs and contract deadlines. */
export function cruiseSpeed(cls: VesselClass, mods: HandlingModifiers = DEFAULT_MODIFIERS): number {
  const factor = cls.propulsion === "engine" ? 0.85 : 0.6;
  return cls.max_speed_knots * factor * mods.speed_multiplier;
}

/** Fuel or provisions needed for a voyage at cruise speed. */
export function estimateEndurance(cls: VesselClass, distanceNm: number, mods: HandlingModifiers = DEFAULT_MODIFIERS): number {
  const speed = cruiseSpeed(cls, mods);
  const days = distanceNm / speed / 24;
  if (cls.propulsion === "engine") {
    const ratio = speed / cls.max_speed_knots;
    return days * cls.consumption_per_day_at_max * (0.05 + 0.95 * ratio ** 3) * mods.consumption_multiplier;
  }
  return days * mods.consumption_multiplier;
}

export function estimateVoyageSeconds(cls: VesselClass, distanceNm: number, mods: HandlingModifiers = DEFAULT_MODIFIERS): number {
  return (distanceNm / cruiseSpeed(cls, mods)) * 3600;
}
