import type { ScenarioCatalog } from "@/data";
import type { PortInfrastructureKind } from "@/data/schemas";
import type { GameState } from "./state";

/** Aggregated effects of researched technologies and active events. */
export interface Modifiers {
  speed_multiplier: number;
  consumption_multiplier: number;
  cargo_multiplier: number;
  port_fee_multiplier: number;
  contract_payment_multiplier: number;
  maintenance_multiplier: number;
  extra_contracts: number;
  unlocked_ships: Set<string>;
  unlocked_infrastructure: Set<PortInfrastructureKind>;
  event_price_mods: Record<string, number>;
}

export function computeModifiers(catalog: ScenarioCatalog, state: GameState): Modifiers {
  const mods: Modifiers = {
    speed_multiplier: 1,
    consumption_multiplier: 1,
    cargo_multiplier: 1,
    port_fee_multiplier: 1,
    contract_payment_multiplier: 1,
    maintenance_multiplier: 1,
    extra_contracts: 0,
    unlocked_ships: new Set(),
    unlocked_infrastructure: new Set(),
    event_price_mods: {},
  };
  for (const techId of state.technologies) {
    const tech = catalog.technologies.find((t) => t.id === techId);
    if (!tech) continue;
    for (const e of tech.effects) {
      switch (e.type) {
        case "speed_multiplier": mods.speed_multiplier *= e.value; break;
        case "consumption_multiplier": mods.consumption_multiplier *= e.value; break;
        case "cargo_multiplier": mods.cargo_multiplier *= e.value; break;
        case "port_fee_multiplier": mods.port_fee_multiplier *= e.value; break;
        case "contract_payment_multiplier": mods.contract_payment_multiplier *= e.value; break;
        case "maintenance_multiplier": mods.maintenance_multiplier *= e.value; break;
        case "extra_contracts": mods.extra_contracts += e.value; break;
        case "unlock_ship": mods.unlocked_ships.add(e.ship_class_id); break;
        case "unlock_infrastructure": mods.unlocked_infrastructure.add(e.infrastructure); break;
      }
    }
  }
  for (const eventId of state.applied_events) {
    const event = catalog.events.find((e) => e.id === eventId);
    if (!event) continue;
    for (const effect of event.effects) {
      if (effect.type === "good_price_modifier") {
        mods.event_price_mods[effect.good_id] = (mods.event_price_mods[effect.good_id] ?? 1) * effect.multiplier;
      }
    }
  }
  return mods;
}
