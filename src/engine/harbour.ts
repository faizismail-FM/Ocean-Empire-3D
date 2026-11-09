import { LANE_NODES } from "@/data/sealanes";
import type { PortRecord } from "@/data/schemas";
import { destinationPoint, distanceNm, fromLocalMeters, headingDifference, initialBearing, interpolate, normalizeHeading, toLocalMeters, type GeoPoint } from "./geo";
import type { Waypoint } from "./state";

/**
 * The harbour model. Every port has a quay and a landmass behind it, drawn by the sailing
 * scene and solid to the simulation. Their placement is a pure function of the port record,
 * so the scene, the router, the autopilot and the grounding check all agree on where the
 * land is:
 *
 *  - The sea lies in the direction of the port's lane nodes (their circular mean bearing);
 *    the quay runs across that direction and the land sits behind it.
 *  - Every route enters and leaves a port through a fairway waypoint a few miles out on the
 *    sea side, so the final approach is straight in from the water.
 *  - A docked ship lies alongside the quay; a departing ship points down the fairway.
 *  - A ship steered into the quay or the shore grounds: it is stopped at the water's edge.
 *
 * All sizes are metres in a port-local frame: +z landward (along the land bearing), +x along
 * the quay. The shapes are deliberately simple; they are a gameplay abstraction, not a chart.
 */

export const FAIRWAY_DISTANCE_NM = 3;
/** Metres a grounded hull is held clear of an obstacle. */
export const GROUNDING_MARGIN_M = 8;
/** A grounded ship stays "aground" until it is this clear of the shore. */
export const AGROUND_CLEAR_M = 60;
/** Nothing of a harbour extends beyond this distance from the port point. */
export const HARBOUR_EXTENT_NM = 2.2;
/** Width of the straight approach corridor in which a ship may head directly for the berth. */
const CORRIDOR_HALF_WIDTH_NM = 0.5;

const SIZE_FACTOR: Record<PortRecord["size"], number> = { minor: 0.7, regional: 1, major: 1.3, hub: 1.6 };

export interface HarbourLayout {
  sizeFactor: number;
  /** Quay length along the waterfront (x). */
  quayLength: number;
  /** Landward distance (z) of the quay face from the berth point and of its back edge. */
  quayNear: number;
  quayFar: number;
  /** Landward distance (z) of the land disc centre and its radius at the waterline. */
  landCenter: number;
  landRadius: number;
  /** Visual hill behind the town. */
  hillCenter: number;
  hillRadius: number;
}

export function harbourLayout(size: PortRecord["size"]): HarbourLayout {
  const sf = SIZE_FACTOR[size] ?? 1;
  return {
    sizeFactor: sf,
    quayLength: 520 * sf,
    quayNear: 60,
    quayFar: 320,
    landCenter: 1250 * sf,
    landRadius: 1100 * sf,
    hillCenter: 1800 * sf,
    hillRadius: 750 * sf,
  };
}

const nodeById = new Map(LANE_NODES.map((n) => [n.id, n]));

export function portPoint(port: PortRecord): GeoPoint {
  return { lat: port.latitude, lon: port.longitude };
}

/**
 * Bearing from the port toward open water: the circular mean of the bearings to its lane
 * nodes, or the record's explicit `sea_bearing` when the data gives one. With no usable
 * node the quay faces east.
 */
export function seaBearing(port: PortRecord): number {
  if (port.sea_bearing !== undefined) return normalizeHeading(port.sea_bearing);
  const origin = portPoint(port);
  let x = 0;
  let y = 0;
  let count = 0;
  for (const id of port.lane_nodes) {
    const node = nodeById.get(id);
    if (!node) continue;
    const b = (initialBearing(origin, node) * Math.PI) / 180;
    x += Math.sin(b);
    y += Math.cos(b);
    count += 1;
  }
  if (count === 0 || Math.hypot(x, y) < 0.05) return 90;
  return normalizeHeading((Math.atan2(x, y) * 180) / Math.PI);
}

export function landBearing(port: PortRecord): number {
  return normalizeHeading(seaBearing(port) + 180);
}

/** The waypoint a route uses to enter or leave the port: straight out on the sea side. */
export function fairwayWaypoint(port: PortRecord): Waypoint {
  const p = destinationPoint(portPoint(port), seaBearing(port), FAIRWAY_DISTANCE_NM);
  return { lat: p.lat, lon: p.lon, label: `${port.name} fairway` };
}

/**
 * Heading of a ship lying alongside the quay: perpendicular to the sea bearing, on the side
 * that needs the smaller swing from `arrivalHeading`.
 */
export function berthHeading(port: PortRecord, arrivalHeading?: number): number {
  const sea = seaBearing(port);
  const a = normalizeHeading(sea + 90);
  if (arrivalHeading === undefined) return a;
  const b = normalizeHeading(sea - 90);
  return Math.abs(headingDifference(arrivalHeading, a)) <= Math.abs(headingDifference(arrivalHeading, b)) ? a : b;
}

/** Position in the port-local frame: x along the quay, z landward (metres). */
export function toHarbourLocal(port: PortRecord, point: GeoPoint): { x: number; z: number } {
  const { x: e, y: n } = toLocalMeters(portPoint(port), point);
  const b = (landBearing(port) * Math.PI) / 180;
  return { x: e * Math.cos(b) - n * Math.sin(b), z: e * Math.sin(b) + n * Math.cos(b) };
}

export function fromHarbourLocal(port: PortRecord, x: number, z: number): GeoPoint {
  const b = (landBearing(port) * Math.PI) / 180;
  const e = x * Math.cos(b) + z * Math.sin(b);
  const n = -x * Math.sin(b) + z * Math.cos(b);
  return fromLocalMeters(portPoint(port), e, n);
}

/**
 * Signed distance (metres) from a port-local point to the harbour's solid shapes: negative
 * inside the quay or the land, positive in open water.
 */
export function harbourClearance(layout: HarbourLayout, p: { x: number; z: number }): number {
  // Land disc.
  const disc = Math.hypot(p.x, p.z - layout.landCenter) - layout.landRadius;
  // Quay box: a rectangle of half-extents (hx, hz) centred on (0, cz).
  const hx = layout.quayLength / 2;
  const hz = (layout.quayFar - layout.quayNear) / 2;
  const cz = (layout.quayNear + layout.quayFar) / 2;
  const qx = Math.abs(p.x) - hx;
  const qz = Math.abs(p.z - cz) - hz;
  const box = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
  return Math.min(disc, box);
}

/**
 * Move a port-local point out of the harbour's shapes until it is `margin` clear of them.
 * The land disc pushes radially; the quay pushes out through its waterfront face or its
 * ends, never through its back (which is inside the land), so the result is always water.
 */
export function pushOut(layout: HarbourLayout, p: { x: number; z: number }, margin = GROUNDING_MARGIN_M): { x: number; z: number } {
  let q = { x: p.x, z: p.z };
  const hx = layout.quayLength / 2;
  for (let i = 0; i < 8; i++) {
    if (harbourClearance(layout, q) >= margin) return q;
    const dz = q.z - layout.landCenter;
    const r = Math.hypot(q.x, dz);
    if (r < layout.landRadius + margin) {
      const target = layout.landRadius + margin + 0.01;
      q = r < 1e-6 ? { x: 0, z: layout.landCenter - target } : { x: (q.x / r) * target, z: layout.landCenter + (dz / r) * target };
      continue;
    }
    if (Math.abs(q.x) < hx + margin && q.z > layout.quayNear - margin && q.z < layout.quayFar + margin) {
      const toFront = q.z - (layout.quayNear - margin);
      const toSide = hx + margin - Math.abs(q.x);
      q = toSide < toFront ? { x: Math.sign(q.x || 1) * (hx + margin + 0.01), z: q.z } : { x: q.x, z: layout.quayNear - margin - 0.01 };
    }
  }
  return q;
}

export interface Grounding {
  port: PortRecord;
  /** The position the hull is held at: the last clear point of the step, pushed to the margin. */
  position: GeoPoint;
}

function harboursNear(ports: readonly PortRecord[], a: GeoPoint, b: GeoPoint): PortRecord[] {
  const reach = HARBOUR_EXTENT_NM + distanceNm(a, b) + 0.1;
  return ports.filter((p) => distanceNm(a, portPoint(p)) <= reach);
}

/**
 * Check a movement step from `from` to `to` against every harbour in reach. Returns the
 * grounding if the path enters the quay or the shore, else null. The path is sampled finely
 * enough that a fast ship cannot tunnel through the quay in one step.
 */
export function sweepGrounding(ports: readonly PortRecord[], from: GeoPoint, to: GeoPoint): Grounding | null {
  const near = harboursNear(ports, from, to);
  if (near.length === 0) return null;
  const stepM = distanceNm(from, to) * 1852;
  const samples = Math.max(1, Math.ceil(stepM / 100));
  for (const port of near) {
    const layout = harbourLayout(port.size);
    let lastClear = toHarbourLocal(port, from);
    for (let i = 1; i <= samples; i++) {
      const point = i === samples ? to : interpolate(from, to, i / samples);
      const local = toHarbourLocal(port, point);
      if (harbourClearance(layout, local) < GROUNDING_MARGIN_M) {
        const held = pushOut(layout, lastClear);
        return { port, position: fromHarbourLocal(port, held.x, held.z) };
      }
      lastClear = local;
    }
  }
  return null;
}

/** The harbour whose quay or shore is nearest to a position, with the clearance in metres; null at sea. */
export function nearestHarbour(ports: readonly PortRecord[], position: GeoPoint): { port: PortRecord; clearance: number } | null {
  let best: { port: PortRecord; clearance: number } | null = null;
  for (const port of ports) {
    if (distanceNm(position, portPoint(port)) > HARBOUR_EXTENT_NM + 0.1) continue;
    const clearance = harbourClearance(harbourLayout(port.size), toHarbourLocal(port, position));
    if (!best || clearance < best.clearance) best = { port, clearance };
  }
  return best;
}

/**
 * True when a ship at `position` can head straight for the berth: it is on the sea side,
 * no further out than the fairway and close to the approach line.
 */
export function inApproachCorridor(port: PortRecord, position: GeoPoint): boolean {
  const local = toHarbourLocal(port, position);
  const fairwayM = FAIRWAY_DISTANCE_NM * 1852;
  return local.z <= 0 && local.z >= -fairwayM - 200 && Math.abs(local.x) <= CORRIDOR_HALF_WIDTH_NM * 1852;
}

/**
 * True when the straight leg a→b stays clear of this harbour's quay and land. Exact
 * (segment against disc and rectangle), used by the data tests over every planned route.
 */
export function legClearsHarbour(port: PortRecord, a: GeoPoint, b: GeoPoint): boolean {
  const layout = harbourLayout(port.size);
  const pa = toHarbourLocal(port, a);
  const pb = toHarbourLocal(port, b);
  // Segment vs disc.
  const dx = pb.x - pa.x;
  const dz = pb.z - pa.z;
  const l2 = dx * dx + dz * dz;
  const cz = layout.landCenter;
  let t = l2 > 0 ? ((0 - pa.x) * dx + (cz - pa.z) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  if (Math.hypot(pa.x + t * dx - 0, pa.z + t * dz - cz) < layout.landRadius) return false;
  // Segment vs quay rectangle (Liang–Barsky clipping).
  const hx = layout.quayLength / 2;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  const inside = clip(-dx, pa.x + hx) && clip(dx, hx - pa.x) && clip(-dz, pa.z - layout.quayNear) && clip(dz, layout.quayFar - pa.z);
  return !inside;
}
