import type { ScenarioCatalog } from "@/data";
import type { Technology } from "@/data/schemas";
import type { GameState } from "./state";

export interface ResearchCheck {
  ok: boolean;
  reason?: string;
  missing: string[];
}

export function canResearch(catalog: ScenarioCatalog, state: GameState, tech: Technology): ResearchCheck {
  if (!catalog.scenario.technologies.includes(tech.id)) return { ok: false, reason: "Not available in this scenario.", missing: [] };
  if (state.technologies.includes(tech.id)) return { ok: false, reason: "Already acquired.", missing: [] };
  const missing = tech.prerequisites.filter((p) => !state.technologies.includes(p));
  if (missing.length > 0) {
    const names = missing.map((id) => catalog.technologies.find((t) => t.id === id)?.name ?? id);
    return { ok: false, reason: `Requires ${names.join(", ")}.`, missing };
  }
  if (state.treasury < tech.cost) return { ok: false, reason: "Insufficient treasury.", missing: [] };
  return { ok: true, missing: [] };
}

export function technologyStatus(catalog: ScenarioCatalog, state: GameState, tech: Technology): "researched" | "available" | "locked" {
  if (state.technologies.includes(tech.id)) return "researched";
  const prereqsMet = tech.prerequisites.every((p) => state.technologies.includes(p));
  return prereqsMet ? "available" : "locked";
}

export { type Technology, type ScenarioCatalog };
