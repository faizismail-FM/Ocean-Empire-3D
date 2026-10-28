import type { ScenarioCatalog } from "@/data";
import type { Objective, ObjectiveCondition } from "@/data/schemas";
import type { GameState } from "./state";

export interface ObjectiveProgress {
  current: number;
  target: number;
  complete: boolean;
}

export function evaluateCondition(state: GameState, condition: ObjectiveCondition): ObjectiveProgress {
  switch (condition.type) {
    case "contracts_completed":
      return progress(state.stats.contracts_completed, condition.count);
    case "contracts_completed_with_port": {
      const n = Object.values(state.contracts).filter(
        (c) => c.status === "completed" && (c.destination_port_id === condition.port_id || c.origin_port_id === condition.port_id),
      ).length;
      return progress(n, condition.count);
    }
    case "treasury_at_least":
      return progress(state.treasury, condition.amount);
    case "visit_port":
      return progress(state.ports[condition.port_id]?.visited ? 1 : 0, 1);
    case "infrastructure_level":
      return progress(state.ports[condition.port_id]?.infrastructure[condition.kind] ?? 0, condition.level);
    case "ships_owned":
      return progress(Object.keys(state.ships).length, condition.count);
    case "technology_researched":
      return progress(state.technologies.includes(condition.technology_id) ? 1 : 0, 1);
    case "goods_delivered":
      return progress(state.stats.goods_delivered[condition.good_id] ?? 0, condition.quantity);
    case "port_access": {
      const access = state.ports[condition.port_id]?.access;
      return progress(access === "open" || access === "agreement" || access === "home" ? 1 : 0, 1);
    }
    case "ports_visited":
      return progress(Object.values(state.ports).filter((p) => p.visited).length, condition.count);
    case "settlements_founded":
      return progress(Object.values(state.ports).filter((p) => p.holding === "settlement" || p.holding === "dependency").length, condition.count);
    case "dependencies_held":
      return progress(Object.values(state.ports).filter((p) => p.holding === "dependency").length, condition.count);
  }
}

function progress(current: number, target: number): ObjectiveProgress {
  return { current, target, complete: current >= target };
}

/**
 * Mark newly completed objectives. Returns the updated state and the objectives completed
 * during this evaluation so the caller can pay rewards and notify the player.
 */
export function evaluateObjectives(catalog: ScenarioCatalog, state: GameState): { state: GameState; completed: Objective[] } {
  const completed: Objective[] = [];
  const objectives = { ...state.objectives };
  for (const obj of catalog.scenario.objectives) {
    const current = objectives[obj.id] ?? { status: "active" as const, completed_sim_seconds: null, rewarded: false };
    if (current.status === "completed") continue;
    const result = evaluateCondition(state, obj.condition);
    if (result.complete) {
      objectives[obj.id] = { status: "completed", completed_sim_seconds: state.sim_seconds, rewarded: false };
      completed.push(obj);
    } else if (!objectives[obj.id]) {
      objectives[obj.id] = current;
    }
  }
  return { state: completed.length > 0 ? { ...state, objectives } : state, completed };
}
