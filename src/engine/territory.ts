import type { ScenarioCatalog } from "@/data";
import type { PortRecord, Region } from "@/data/schemas";
import { clamp } from "@/lib/utils";
import { applyTransaction } from "./economy";
import { economicScale } from "./portdev";
import { marketShare } from "./rivals";
import type { GameState, PortState } from "./state";

/**
 * Territory (brief 8.2): regions, ports, ownership, access agreements, commercial influence,
 * development levels and historical time ranges.
 *
 * Sovereign territory is never for sale. What a trading house can hold is:
 *
 *  - influence (0..100) at every port, which follows its share of the traffic, its
 *    facilities and its holdings, and decays when it stays away;
 *  - a trading settlement at a foreign port (a merchant colony or fondaco), which the
 *    scenario's rules may allow where the sources attest such communities;
 *  - a dependency, a port brought under the house's protection, allowed only in scenarios
 *    whose rules say so (Kilwa's hold on Sofala is the model) and never at a great city.
 *
 * Regions summarise influence over the scenario's ports. Access agreements remain the
 * business of diplomacy; a settlement grants the same building rights as an agreement.
 */

export type Holding = PortState["holding"];

export interface TerritoryCheck {
  ok: boolean;
  reason?: string;
  cost: number;
}

export function settlementCost(catalog: ScenarioCatalog): number {
  return Math.round(economicScale(catalog) * 14);
}

export function dependencyCost(catalog: ScenarioCatalog): number {
  return Math.round(economicScale(catalog) * 40);
}

/** Daily upkeep of the house's holdings: agents, guards and gifts to the local ruler. */
export function territoryUpkeep(catalog: ScenarioCatalog, state: GameState): number {
  const scale = economicScale(catalog);
  let total = 0;
  for (const ps of Object.values(state.ports)) {
    if (ps.holding === "settlement") total += scale * 0.012;
    else if (ps.holding === "dependency") total += scale * 0.03;
  }
  return Math.round(total);
}

/** The player's share of recorded calls at a port, 0..1 (1 when nobody has called). */
function playerShare(state: GameState, portId: string): number {
  const rows = marketShare(state, portId);
  const total = rows.reduce((s, r) => s + r.calls, 0);
  if (total === 0) return 0;
  return rows.find((r) => r.rival_id === null)?.share ?? 0;
}

/** Where influence settles if nothing changes: calls, facilities, holdings and rivals. */
export function influenceTarget(state: GameState, portId: string): number {
  const ps = state.ports[portId];
  if (!ps) return 0;
  if (ps.access === "home") return 100;
  let target = ps.visited ? 10 : 0;
  target += 45 * playerShare(state, portId);
  // Facilities count only where the house can build: elsewhere they are the port's own.
  if (holdsPort(ps)) target += Math.min(20, 5 * Object.values(ps.infrastructure).reduce((a, b) => a + b, 0));
  if (ps.access === "agreement") target += 5;
  if (ps.holding === "settlement") target += 20;
  if (ps.holding === "dependency") target += 35;
  for (const rival of Object.values(state.rivals)) target -= 4 * (rival.developed[portId] ?? 0);
  if (ps.access === "closed") target = Math.min(target, 10);
  return clamp(Math.round(target), 0, 100);
}

/** Daily: influence closes a thirtieth of the gap to its target each day. */
export function tickInfluence(state: GameState, days: number): GameState {
  const ports: GameState["ports"] = { ...state.ports };
  let changed = false;
  for (const [id, ps] of Object.entries(ports)) {
    const target = influenceTarget(state, id);
    const next = clamp(ps.influence + (target - ps.influence) * (1 - Math.pow(1 - 1 / 30, days)), 0, 100);
    const rounded = Math.round(next * 10) / 10;
    if (rounded !== ps.influence) {
      ports[id] = { ...ps, influence: rounded };
      changed = true;
    }
  }
  return changed ? { ...state, ports } : state;
}

export function influenceLabel(value: number): string {
  if (value >= 75) return "dominant";
  if (value >= 50) return "strong";
  if (value >= 25) return "present";
  if (value >= 10) return "slight";
  return "none";
}

function relationWith(catalog: ScenarioCatalog, state: GameState, port: PortRecord): { relation: number; own: boolean } {
  if (!port.polity_id || port.polity_id === catalog.scenario.player_polity_id) return { relation: 100, own: true };
  return { relation: state.diplomacy[port.polity_id]?.relation ?? 50, own: false };
}

export function canFoundSettlement(catalog: ScenarioCatalog, state: GameState, portId: string): TerritoryCheck {
  const cost = settlementCost(catalog);
  const rules = catalog.scenario.territory_rules;
  const port = catalog.portMap.get(portId);
  const ps = state.ports[portId];
  if (!port || !ps) return { ok: false, reason: "Unknown port.", cost };
  if (!catalog.scenario.features.territory || !rules.settlements) return { ok: false, reason: rules.settlement_note, cost };
  if (ps.access === "home") return { ok: false, reason: "This is your home port.", cost };
  if (ps.holding !== "none") return { ok: false, reason: "Your house already has a settlement here.", cost };
  if (ps.access === "closed" || ps.access === "restricted") return { ok: false, reason: "Your ships must be able to call here first (open port or access agreement).", cost };
  if (!ps.visited) return { ok: false, reason: "Call at this port before settling agents here.", cost };
  if (ps.influence < 25) return { ok: false, reason: "Your influence here must reach 25 (trade here regularly or build facilities).", cost };
  const { relation } = relationWith(catalog, state, port);
  if (relation < 50) return { ok: false, reason: "Relations with the port's ruler must reach 50.", cost };
  if (state.treasury < cost) return { ok: false, reason: "Insufficient treasury.", cost };
  return { ok: true, cost };
}

export function canAcquireDependency(catalog: ScenarioCatalog, state: GameState, portId: string): TerritoryCheck {
  const cost = dependencyCost(catalog);
  const rules = catalog.scenario.territory_rules;
  const port = catalog.portMap.get(portId);
  const ps = state.ports[portId];
  if (!port || !ps) return { ok: false, reason: "Unknown port.", cost };
  if (!catalog.scenario.features.territory || !rules.dependencies) return { ok: false, reason: rules.dependency_note, cost };
  if (ps.access === "home") return { ok: false, reason: "This is your home port.", cost };
  if (ps.holding === "dependency") return { ok: false, reason: "Already under your protection.", cost };
  if (ps.holding !== "settlement") return { ok: false, reason: "Found a settlement here first.", cost };
  if (port.size === "hub") return { ok: false, reason: "Too great a city to come under a merchant house.", cost };
  if (ps.influence < 70) return { ok: false, reason: "Your influence here must reach 70.", cost };
  const { relation, own } = relationWith(catalog, state, port);
  if (!own && relation < 65) return { ok: false, reason: "Relations with the port's ruler must reach 65.", cost };
  const share = playerShare(state, portId);
  const rivalDominant = marketShare(state, portId).some((r) => r.rival_id !== null && r.share >= 0.5 && r.calls >= 3);
  if (rivalDominant || share < 0.3) return { ok: false, reason: "Your ships must carry the larger part of this port's traffic.", cost };
  if (state.treasury < cost) return { ok: false, reason: "Insufficient treasury.", cost };
  return { ok: true, cost };
}

export function foundSettlement(catalog: ScenarioCatalog, state: GameState, portId: string): GameState {
  const check = canFoundSettlement(catalog, state, portId);
  if (!check.ok) throw new Error(check.reason ?? "Cannot found a settlement here.");
  const port = catalog.portMap.get(portId)!;
  const ps = state.ports[portId]!;
  let next = applyTransaction(state, -check.cost, "territory", `Trading settlement founded at ${port.name}`, { port_id: portId });
  next = {
    ...next,
    ports: {
      ...next.ports,
      [portId]: { ...ps, holding: "settlement", holding_since: state.sim_seconds, access: ps.access === "open" ? "agreement" : ps.access, influence: clamp(ps.influence + 15, 0, 100), prosperity: clamp(ps.prosperity + 2, 0, 100) },
    },
  };
  return next;
}

export function acquireDependency(catalog: ScenarioCatalog, state: GameState, portId: string): GameState {
  const check = canAcquireDependency(catalog, state, portId);
  if (!check.ok) throw new Error(check.reason ?? "Cannot bring this port under protection.");
  const port = catalog.portMap.get(portId)!;
  const ps = state.ports[portId]!;
  let next = applyTransaction(state, -check.cost, "territory", `${port.name} brought under the house's protection`, { port_id: portId });
  const diplomacy = { ...next.diplomacy };
  const { own } = relationWith(catalog, state, port);
  if (!own && port.polity_id && diplomacy[port.polity_id]) {
    const d = diplomacy[port.polity_id]!;
    diplomacy[port.polity_id] = { ...d, relation: clamp(d.relation - 10, 0, 100) };
  }
  next = {
    ...next,
    diplomacy,
    ports: { ...next.ports, [portId]: { ...ps, holding: "dependency", holding_since: state.sim_seconds, access: "agreement", influence: clamp(ps.influence + 15, 0, 100), fee_multiplier: ps.fee_multiplier } },
  };
  return next;
}

export interface RegionSummary {
  region: Region;
  influence: number;
  label: string;
  ports: Array<{ port: PortRecord; state: PortState }>;
  settlements: number;
  dependencies: number;
  agreements: number;
}

/** Influence and holdings summarised per region. */
export function regionSummaries(catalog: ScenarioCatalog, state: GameState): RegionSummary[] {
  return catalog.scenario.regions.map((region) => {
    const ports = region.port_ids
      .map((id) => ({ port: catalog.portMap.get(id), state: state.ports[id] }))
      .filter((x): x is { port: PortRecord; state: PortState } => !!x.port && !!x.state);
    const influence = ports.length > 0 ? Math.round(ports.reduce((s, p) => s + p.state.influence, 0) / ports.length) : 0;
    return {
      region,
      influence,
      label: influenceLabel(influence),
      ports,
      settlements: ports.filter((p) => p.state.holding === "settlement").length,
      dependencies: ports.filter((p) => p.state.holding === "dependency").length,
      agreements: ports.filter((p) => p.state.access === "agreement" || p.state.access === "home").length,
    };
  });
}

export function holdingsCount(state: GameState): { settlements: number; dependencies: number } {
  let settlements = 0;
  let dependencies = 0;
  for (const ps of Object.values(state.ports)) {
    if (ps.holding === "settlement") settlements++;
    else if (ps.holding === "dependency") dependencies++;
  }
  return { settlements, dependencies };
}

/** Facilities above the basics are allowed where the house holds the port in some way. */
export function holdsPort(ps: PortState): boolean {
  return ps.access === "home" || ps.access === "agreement" || ps.holding !== "none";
}
