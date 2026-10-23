import type { Technology } from "../schemas";

/** Modern "technology" is operational capability rather than invention. Costs are abstractions. */
export const MODERN_TECHNOLOGIES: Technology[] = [
  {
    id: "tech_slow_steaming", name: "Slow steaming programme", branch: "vessel_efficiency", cost: 1_500_000, prerequisites: [],
    effects: [{ type: "consumption_multiplier", value: 0.85 }],
    description: "Operate engines below design speed and tune them for lower loads, cutting fuel burn.",
    historical_notes: "Container lines adopted slow steaming widely after the 2008 fuel-price spike and the subsequent downturn.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "tech_hull_coatings", name: "Advanced hull coatings", branch: "vessel_efficiency", cost: 2_500_000, prerequisites: ["tech_slow_steaming"],
    effects: [{ type: "consumption_multiplier", value: 0.92 }, { type: "speed_multiplier", value: 1.03 }],
    description: "Low-friction, fouling-release coatings applied at dry-docking.",
    historical_notes: "Hull condition is one of the largest controllable factors in a ship's fuel consumption.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "tech_route_optimisation", name: "Weather routing & voyage optimisation", branch: "navigation", cost: 1_200_000, prerequisites: [],
    effects: [{ type: "speed_multiplier", value: 1.05 }],
    description: "Shore-based voyage planning using weather forecasts and current data.",
    historical_notes: "Weather routing services have been offered to merchant fleets since the mid-twentieth century.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "tech_terminal_agreements", name: "Terminal service agreements", branch: "port_infrastructure", cost: 2_000_000, prerequisites: [],
    effects: [{ type: "port_fee_multiplier", value: 0.9 }],
    description: "Volume commitments with terminal operators in exchange for lower handling rates and priority berthing.",
    historical_notes: "Terminal handling is a major component of liner operating cost.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "tech_hub_partnerships", name: "Hub transhipment partnerships", branch: "commercial_administration", cost: 4_000_000, prerequisites: ["tech_terminal_agreements"],
    effects: [{ type: "extra_contracts", value: 2 }, { type: "contract_payment_multiplier", value: 1.05 }],
    description: "Feeder agreements with mainline carriers at hub ports, unlocking larger vessels and more cargo.",
    historical_notes: "Hub-and-spoke networks centred on ports such as Singapore shape modern container flows.",
    evidence_status: "established", sources: ["src_unctad_rmt", "src_levinson_box"],
  },
  {
    id: "tech_digital_operations", name: "Digital fleet operations", branch: "maritime_communication", cost: 6_000_000, prerequisites: ["tech_hub_partnerships", "tech_route_optimisation"],
    effects: [{ type: "maintenance_multiplier", value: 0.9 }, { type: "contract_payment_multiplier", value: 1.05 }],
    description: "Electronic documentation, fleet performance monitoring and predictive maintenance.",
    historical_notes: "Digitalisation of shipping documentation accelerated in the 2010s and 2020s.",
    evidence_status: "established", sources: ["src_unctad_rmt"],
  },
  {
    id: "tech_cargo_handling_modern", name: "Automated cargo handling", branch: "cargo_handling", cost: 5_000_000, prerequisites: ["tech_terminal_agreements"],
    effects: [{ type: "cargo_multiplier", value: 1.05 }, { type: "port_fee_multiplier", value: 0.95 }],
    description: "Optimised stowage planning and automated terminal interfaces that make better use of every slot.",
    historical_notes: "Automated terminals such as Rotterdam's Maasvlakte II operate with remotely controlled equipment.",
    evidence_status: "established", sources: ["src_port_of_rotterdam"],
  },
];
