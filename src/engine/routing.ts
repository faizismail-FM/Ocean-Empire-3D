import { LANE_EDGES, LANE_NODES, type LaneNode } from "@/data/sealanes";
import type { PortRecord } from "@/data/schemas";
import { distanceNm, pathLengthNm, type GeoPoint } from "./geo";
import type { Waypoint } from "./state";

/**
 * Route planning over the simplified sea-lane graph (Dijkstra). A route is a list of
 * waypoints from the origin port through lane nodes to the destination port.
 */

interface Graph {
  nodes: Map<string, LaneNode>;
  adjacency: Map<string, Array<{ to: string; distance: number }>>;
}

let cachedGraph: Graph | null = null;

function buildGraph(): Graph {
  if (cachedGraph) return cachedGraph;
  const nodes = new Map<string, LaneNode>();
  for (const n of LANE_NODES) nodes.set(n.id, n);
  const adjacency = new Map<string, Array<{ to: string; distance: number }>>();
  const add = (a: string, b: string, d: number) => {
    const list = adjacency.get(a) ?? [];
    list.push({ to: b, distance: d });
    adjacency.set(a, list);
  };
  for (const [a, b] of LANE_EDGES) {
    const na = nodes.get(a);
    const nb = nodes.get(b);
    if (!na || !nb) throw new Error(`Sea lane edge references unknown node: ${a}-${b}`);
    const d = distanceNm(na, nb);
    add(a, b, d);
    add(b, a, d);
  }
  cachedGraph = { nodes, adjacency };
  return cachedGraph;
}

export function getLaneNode(id: string): LaneNode | undefined {
  return buildGraph().nodes.get(id);
}

export function laneNodeUsable(node: LaneNode, year: number): boolean {
  return node.available_from_year === undefined || year >= node.available_from_year;
}

export interface PlannedRoute {
  waypoints: Waypoint[];
  distance_nm: number;
  via: string[];
}

/**
 * Plan a route between two ports. Returns null when no lane path exists.
 * `year` disables canal nodes that did not exist yet in the scenario period.
 */
export function planRoute(origin: PortRecord, destination: PortRecord, year: number): PlannedRoute | null {
  if (origin.id === destination.id) return null;
  const graph = buildGraph();
  const originPoint: GeoPoint = { lat: origin.latitude, lon: origin.longitude };
  const destPoint: GeoPoint = { lat: destination.latitude, lon: destination.longitude };

  // Direct hop when the ports share a lane node and are close.
  const shared = origin.lane_nodes.filter((n) => destination.lane_nodes.includes(n));
  const direct = distanceNm(originPoint, destPoint);
  if (shared.length > 0 && direct < 120) {
    return {
      waypoints: [portWaypoint(origin), portWaypoint(destination)],
      distance_nm: direct,
      via: [],
    };
  }

  // Dijkstra from a virtual origin connected to the origin's lane nodes.
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [];

  for (const n of origin.lane_nodes) {
    const node = graph.nodes.get(n);
    if (!node || !laneNodeUsable(node, year)) continue;
    const d = distanceNm(originPoint, node);
    dist.set(n, d);
    prev.set(n, null);
    queue.push({ id: n, d });
  }

  const destNodes = new Set(destination.lane_nodes);
  let best: { id: string; total: number } | null = null;

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const current = queue.shift();
    if (!current) break;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    const currentNode = graph.nodes.get(current.id);
    if (!currentNode) continue;

    if (destNodes.has(current.id)) {
      const total = current.d + distanceNm(currentNode, destPoint);
      if (!best || total < best.total) best = { id: current.id, total };
    }
    if (best && current.d > best.total) break;

    for (const edge of graph.adjacency.get(current.id) ?? []) {
      const next = graph.nodes.get(edge.to);
      if (!next || !laneNodeUsable(next, year) || visited.has(edge.to)) continue;
      const nd = current.d + edge.distance;
      if (nd < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nd);
        prev.set(edge.to, current.id);
        queue.push({ id: edge.to, d: nd });
      }
    }
  }

  if (!best) return null;
  const via: string[] = [];
  let cursor: string | null = best.id;
  while (cursor) {
    via.unshift(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  const waypoints: Waypoint[] = [portWaypoint(origin)];
  for (const id of via) {
    const node = graph.nodes.get(id);
    if (node) waypoints.push({ lat: node.lat, lon: node.lon, label: node.name });
  }
  waypoints.push(portWaypoint(destination));
  return { waypoints, distance_nm: pathLengthNm(waypoints), via };
}

export function portWaypoint(port: PortRecord): Waypoint {
  return { lat: port.latitude, lon: port.longitude, label: port.name, port_id: port.id };
}

/** Remaining distance along a route from a position, given the index of the next waypoint. */
export function remainingDistanceNm(position: GeoPoint, route: Waypoint[], waypointIndex: number): number {
  const next = route[waypointIndex];
  if (!next) return 0;
  let total = distanceNm(position, next);
  for (let i = waypointIndex + 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    if (a && b) total += distanceNm(a, b);
  }
  return total;
}

/** The `count` lane nodes nearest to a position, usable in the given year. */
export function nearestLaneNodes(position: GeoPoint, year: number, count = 2): LaneNode[] {
  return LANE_NODES.filter((n) => laneNodeUsable(n, year))
    .map((n) => ({ n, d: distanceNm(position, n) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.n);
}

/** Plan a route from an arbitrary sea position (a ship under way) to a port. */
export function planRouteFromPosition(position: GeoPoint, destination: PortRecord, year: number): PlannedRoute | null {
  const direct = distanceNm(position, { lat: destination.latitude, lon: destination.longitude });
  if (direct < 60) {
    const waypoints: Waypoint[] = [{ lat: position.lat, lon: position.lon, label: "Current position" }, portWaypoint(destination)];
    return { waypoints, distance_nm: direct, via: [] };
  }
  const virtualOrigin: PortRecord = {
    ...destination,
    id: "__position__",
    name: "Current position",
    latitude: position.lat,
    longitude: position.lon,
    lane_nodes: nearestLaneNodes(position, year, 3).map((n) => n.id),
  };
  const planned = planRoute(virtualOrigin, destination, year);
  if (!planned) return null;
  const first = planned.waypoints[0];
  if (first) planned.waypoints[0] = { lat: position.lat, lon: position.lon, label: "Current position" };
  return planned;
}
