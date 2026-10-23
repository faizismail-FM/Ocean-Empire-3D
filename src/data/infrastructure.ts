import type { InfrastructureDefinition } from "./schemas";

/**
 * Port infrastructure that players can invest in. Costs are multiplied by the scenario's
 * economic scale (see `scaleInfrastructureCost` in the engine). All values are gameplay
 * abstractions. Scenarios restrict which kinds are available in their period.
 */
export const INFRASTRUCTURE: InfrastructureDefinition[] = [
  {
    kind: "docks",
    name: "Docks",
    description: "Quays, moorings and berths. Larger docks reduce the fees charged to your own ships and speed up turnaround.",
    base_cost: 1,
    cost_growth: 1.7,
    max_level: 5,
    effect_summary: "-6% port fees per level at this port",
    era_names: { medieval: "Quays and moorings", modern: "Berths and quays" },
  },
  {
    kind: "warehouse",
    name: "Warehouse",
    description: "Secure storage for goods awaiting shipment. Warehouses raise the local sale price your traders can obtain and widen the contract market.",
    base_cost: 0.8,
    cost_growth: 1.6,
    max_level: 5,
    effect_summary: "+4% local cargo sale price and +1 contract offer per level",
    era_names: { medieval: "Storehouse (funduq / gudang)", modern: "Container yard and warehouse" },
  },
  {
    kind: "shipyard",
    name: "Shipyard",
    description: "Slipways and craftsmen able to build vessels. Each level unlocks larger hulls from the scenario's catalogue.",
    base_cost: 2.5,
    cost_growth: 1.9,
    max_level: 4,
    effect_summary: "Unlocks ship classes requiring this shipyard level",
    era_names: { medieval: "Shipwrights' yard", modern: "Shipyard and dry dock" },
  },
  {
    kind: "cargo_handling",
    name: "Cargo handling",
    description: "Porters, cranes and lighters that move goods between ship and shore. Improves the revenue earned on contracts from this port.",
    base_cost: 1.2,
    cost_growth: 1.7,
    max_level: 5,
    effect_summary: "+3% contract payment per level for contracts starting here",
    era_names: { medieval: "Porters and lighters", modern: "Quay cranes and terminal equipment" },
  },
  {
    kind: "navigation",
    name: "Navigation facilities",
    description: "Beacons, pilots and harbour marks that make the approach safer and faster.",
    base_cost: 1,
    cost_growth: 1.6,
    max_level: 3,
    effect_summary: "Reduces approach time; -4% port fees per level",
    era_names: { medieval: "Harbour beacon and pilots", modern: "Vessel traffic services and pilotage" },
  },
  {
    kind: "repair",
    name: "Repair facilities",
    description: "Careening beaches, workshops and dry docks that keep hulls sound.",
    base_cost: 1.1,
    cost_growth: 1.6,
    max_level: 3,
    effect_summary: "Repairs cost 15% less per level at this port",
    era_names: { medieval: "Careening yard", modern: "Repair yard" },
  },
  {
    kind: "administration",
    name: "Administration",
    description: "Customs house and harbour officials. At a home port this produces a steady daily income from duties.",
    base_cost: 1.5,
    cost_growth: 1.8,
    max_level: 4,
    effect_summary: "Daily duty income at your home port",
    era_names: { medieval: "Customs house (harbourmaster)", modern: "Port authority office" },
  },
  {
    kind: "commercial_district",
    name: "Commercial district",
    description: "Markets and merchants' quarters that draw more trade to the port.",
    base_cost: 1.4,
    cost_growth: 1.7,
    max_level: 4,
    effect_summary: "+1 contract offer and +2% sale prices per level",
    era_names: { medieval: "Merchants' quarter and bazaar", modern: "Free trade zone" },
  },
];

export function getInfrastructureDefinition(kind: InfrastructureDefinition["kind"]): InfrastructureDefinition {
  const def = INFRASTRUCTURE.find((i) => i.kind === kind);
  if (!def) throw new Error(`Unknown infrastructure kind ${kind}`);
  return def;
}
