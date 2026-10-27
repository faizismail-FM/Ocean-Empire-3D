import type { ScenarioCatalog } from "@/data";
import { getInfrastructureDefinition } from "@/data/infrastructure";
import type { PortInfrastructureKind } from "@/data/schemas";
import { prosperityFactor, workforceSupports } from "./demographics";
import type { GameState } from "./state";

/**
 * Port development rules. Infrastructure costs scale with the scenario's economy so the
 * same definitions serve dinars, trade cash and dollars.
 */

export function economicScale(catalog: ScenarioCatalog): number {
  // A unit cost roughly equal to a tenth of the cheapest ship keeps upgrades meaningful.
  const cheapest = Math.min(...catalog.ships.map((s) => s.purchase_cost));
  return cheapest * 0.12;
}

export function infrastructureCost(catalog: ScenarioCatalog, kind: PortInfrastructureKind, currentLevel: number): number {
  const def = getInfrastructureDefinition(kind);
  return Math.round(def.base_cost * economicScale(catalog) * Math.pow(def.cost_growth, currentLevel));
}

export interface DevelopmentCheck {
  ok: boolean;
  reason?: string;
  cost: number;
  next_level: number;
}

export function canDevelop(catalog: ScenarioCatalog, state: GameState, portId: string, kind: PortInfrastructureKind): DevelopmentCheck {
  const def = getInfrastructureDefinition(kind);
  const portState = state.ports[portId];
  const current = portState?.infrastructure[kind] ?? 0;
  const cost = infrastructureCost(catalog, kind, current);
  const next = current + 1;
  if (!portState) return { ok: false, reason: "Unknown port.", cost, next_level: next };
  if (!catalog.scenario.infrastructure_available.includes(kind)) return { ok: false, reason: "Not available in this period.", cost, next_level: next };
  if (current >= def.max_level) return { ok: false, reason: "Already at maximum level.", cost, next_level: next };
  const developable = portState.access === "home" || portState.access === "agreement" || (catalog.scenario.mode === "modern" && portState.visited);
  if (!developable) {
    return {
      ok: false,
      reason: catalog.scenario.mode === "modern" ? "Call at this port before leasing facilities here." : "You may only build at your home port or where you hold a trade agreement.",
      cost,
      next_level: next,
    };
  }
  if (!workforceSupports(portState, next)) return { ok: false, reason: "The port is not prosperous enough to staff this (prosperity 40 needed).", cost, next_level: next };
  if (state.treasury < cost) return { ok: false, reason: "Insufficient treasury.", cost, next_level: next };
  return { ok: true, cost, next_level: next };
}

/** Port fee for a ship class at a port, after infrastructure, events and technology. */
export function portFee(catalog: ScenarioCatalog, state: GameState, portId: string, cargoCapacity: number, techMultiplier: number): number {
  const port = catalog.portMap.get(portId);
  const ps = state.ports[portId];
  if (!port || !ps) return 0;
  const reference = Math.max(...catalog.ships.map((s) => s.cargo_capacity));
  const sizeFactor = 0.5 + 0.5 * (cargoCapacity / reference);
  const docks = ps.infrastructure.docks ?? 0;
  const nav = ps.infrastructure.navigation ?? 0;
  const infraDiscount = Math.max(0.5, 1 - 0.06 * docks - 0.04 * nav);
  const homeDiscount = ps.access === "home" ? 0.5 : ps.access === "agreement" ? 0.85 : 1;
  return Math.round(catalog.scenario.base_port_fee * port.fee_modifier * ps.fee_multiplier * sizeFactor * infraDiscount * homeDiscount * techMultiplier);
}

/** Daily duty income from the home port's administration. */
export function dailyAdministrationIncome(catalog: ScenarioCatalog, state: GameState): number {
  const home = state.ports[state.empire.home_port_id];
  if (!home) return 0;
  const level = home.infrastructure.administration ?? 0;
  if (level === 0) return 0;
  const scale = economicScale(catalog);
  // Duties follow the home port's prosperity: a thriving port pays more, a declining one less.
  const prosperity = home.population > 0 ? prosperityFactor(home) : 1;
  return Math.round(scale * 0.02 * level * level * prosperity);
}

export function repairCost(catalog: ScenarioCatalog, state: GameState, portId: string, purchaseCost: number, condition: number): number {
  const missing = Math.max(0, 100 - condition);
  const level = state.ports[portId]?.infrastructure.repair ?? 0;
  return Math.round(purchaseCost * 0.004 * missing * Math.max(0.5, 1 - 0.15 * level));
}
