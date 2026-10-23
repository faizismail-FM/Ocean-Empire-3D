import type { VesselClass } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { distanceNm, headingDifference, initialBearing, normalizeHeading, type GeoPoint } from "./geo";
import type { Waypoint } from "./state";
import { maxTurnRate } from "./ship";
import { isInIrons, type Wind } from "./wind";

/** Distance at which a waypoint counts as reached. Ports use a wider radius. */
export const WAYPOINT_RADIUS_NM = 1.5;
export const ARRIVAL_RADIUS_NM = 0.6;

export interface AutopilotInput {
  rudder: number;
  throttle: number;
  desired_heading: number;
  tacking: boolean;
}

/**
 * Compute rudder and throttle to steer toward a waypoint. Sailing vessels that cannot point
 * directly at the target bear away to the edge of the no-sail cone and alternate tacks on a
 * simple timer, a deliberately simple abstraction of upwind sailing.
 */
export function computeAutopilot(
  cls: VesselClass,
  position: GeoPoint,
  heading: number,
  speed: number,
  target: Waypoint,
  isFinal: boolean,
  wind: Wind | null,
  simSeconds: number,
  dt = 1,
): AutopilotInput {
  const distance = distanceNm(position, target);
  let desired = initialBearing(position, target);
  let tacking = false;

  if (cls.propulsion === "sail" && wind && wind.speed_knots > 0) {
    const minAngle = (cls.min_sailing_angle_deg ?? 60) + 5;
    if (isInIrons(desired, wind, minAngle)) {
      // Far from the target, alternate tacks every 4 simulated hours; close in, take the
      // tack that lies on the same side of the wind as the target.
      const tackPhase = Math.floor(simSeconds / (4 * 3600)) % 2 === 0 ? 1 : -1;
      const sideOfDesired = Math.sign(headingDifference(wind.from, desired)) || tackPhase;
      const side = distance > 15 ? tackPhase : sideOfDesired;
      desired = normalizeHeading(wind.from + side * minAngle);
      tacking = true;
    }
  }

  // Rudder sized so that one integration step of length `dt` does not overshoot the
  // desired heading; at small dt this behaves like a proportional controller.
  const error = headingDifference(heading, desired);
  const maxTurn = Math.max(maxTurnRate(cls, Math.max(speed, 0.5)) * dt, 1e-6);
  const rudder = clamp(error / Math.max(maxTurn, 8), -1, 1);

  // Slow down for the final approach so the ship does not overshoot the berth.
  let throttle = 1;
  if (isFinal) {
    const stoppingNm = (speed * speed) / (2 * Math.max(cls.deceleration_knots_per_s, 0.01) * 3600) * 1.5;
    if (distance < Math.max(stoppingNm, 1.5)) throttle = clamp(distance / Math.max(stoppingNm, 1.5), 0.25, 1);
    if (distance < ARRIVAL_RADIUS_NM * 1.5) throttle = 0.2;
  }
  if (Math.abs(error) > 60) throttle = Math.min(throttle, 0.6);

  return { rudder, throttle, desired_heading: desired, tacking };
}

/** Returns the index of the waypoint the ship should steer for after checking arrivals. */
export function advanceWaypoint(position: GeoPoint, route: Waypoint[], index: number): { index: number; reached: Waypoint[] } {
  const reached: Waypoint[] = [];
  let i = index;
  while (i < route.length) {
    const wp = route[i];
    if (!wp) break;
    const isFinal = i === route.length - 1;
    const radius = isFinal ? ARRIVAL_RADIUS_NM : WAYPOINT_RADIUS_NM;
    if (distanceNm(position, wp) <= radius) {
      reached.push(wp);
      i += 1;
      if (isFinal) break;
    } else break;
  }
  return { index: i, reached };
}

export function hasArrived(position: GeoPoint, route: Waypoint[]): boolean {
  const last = route[route.length - 1];
  if (!last) return false;
  return distanceNm(position, last) <= ARRIVAL_RADIUS_NM;
}
