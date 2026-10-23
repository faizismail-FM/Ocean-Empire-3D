import type { PortRecordInput as PortRecord } from "../schemas";

/**
 * Modern container ports. Coordinates point at the main container terminal area of each
 * port and are accurate to roughly a kilometre; they are reference data, not navigation
 * data. Supply/demand lists are gameplay abstractions informed by each port's broad role.
 */
const MODERN_PERIOD = { start: 1990, end: null };

function port(p: Omit<PortRecord, "active_period" | "evidence_status" | "historical_names" | "location_certainty" | "infrastructure" | "fee_modifier"> & Partial<Pick<PortRecord, "infrastructure" | "fee_modifier" | "historical_names">>): PortRecord {
  return {
    active_period: MODERN_PERIOD,
    evidence_status: "established",
    historical_names: [],
    location_certainty: "precise",
    infrastructure: {},
    fee_modifier: 1,
    ...p,
  };
}

export const MODERN_PORTS: PortRecord[] = [
  port({
    id: "port_klang", name: "Port Klang", modern_reference_name: "Port Klang", latitude: 2.99, longitude: 101.37,
    historical_polity: "Malaysia", polity_id: null, country: "Malaysia",
    historical_significance: "Malaysia's principal container gateway on the Strait of Malacca, comprising Northport, Southpoint and the Westports terminals on Pulau Indah.",
    supplies: ["electronics", "palm_oil", "furniture", "rubber_products"], demands: ["machinery", "consumer_goods", "auto_parts"],
    default_access: "home", lane_nodes: ["malacca_mid", "malacca_s"], sources: ["src_port_klang_authority"], size: "hub",
  }),
  port({
    id: "singapore", name: "Singapore", modern_reference_name: "Singapore", latitude: 1.264, longitude: 103.80,
    historical_polity: "Singapore", polity_id: null, country: "Singapore",
    historical_significance: "One of the world's two busiest container ports and the leading transhipment hub between the Indian Ocean and the South China Sea; terminals at Pasir Panjang and the new Tuas mega-port.",
    supplies: ["electronics", "chemicals", "machinery", "consumer_goods"], demands: ["electronics", "garments", "palm_oil", "refrigerated_food"],
    default_access: "open", lane_nodes: ["singapore_strait"], sources: ["src_mpa_singapore"], size: "hub", fee_modifier: 1.15,
  }),
  port({
    id: "tanjung_priok", name: "Tanjung Priok", modern_reference_name: "Jakarta (Tanjung Priok)", latitude: -6.10, longitude: 106.88,
    historical_polity: "Indonesia", polity_id: null, country: "Indonesia",
    historical_significance: "Indonesia's largest and busiest seaport, serving the Jakarta metropolitan area and Java's manufacturing belt.",
    supplies: ["garments", "furniture", "palm_oil", "paper_pulp"], demands: ["machinery", "auto_parts", "chemicals", "consumer_goods"],
    default_access: "open", lane_nodes: ["sunda_java_sea_w"], sources: ["src_unctad_rmt"], size: "major",
  }),
  port({
    id: "laem_chabang", name: "Laem Chabang", modern_reference_name: "Laem Chabang", latitude: 13.08, longitude: 100.88,
    historical_polity: "Thailand", polity_id: null, country: "Thailand",
    historical_significance: "Thailand's main deep-sea container port on the Gulf of Thailand, serving the Bangkok region and the Eastern Economic Corridor's automotive industry.",
    supplies: ["auto_parts", "refrigerated_food", "rubber_products", "electronics"], demands: ["machinery", "chemicals", "consumer_goods"],
    default_access: "open", lane_nodes: ["gulf_of_thailand_n"], sources: ["src_unctad_rmt"], size: "major",
  }),
  port({
    id: "shanghai", name: "Shanghai (Yangshan)", modern_reference_name: "Shanghai", latitude: 30.63, longitude: 122.06,
    historical_polity: "China", polity_id: null, country: "China",
    historical_significance: "The world's busiest container port by throughput; the Yangshan deep-water terminals sit on islands in Hangzhou Bay linked to the mainland by the Donghai Bridge.",
    supplies: ["electronics", "machinery", "consumer_goods", "garments", "auto_parts"], demands: ["paper_pulp", "refrigerated_food", "chemicals"],
    default_access: "open", lane_nodes: ["yangtze_mouth"], sources: ["src_unctad_rmt"], size: "hub", fee_modifier: 1.1,
  }),
  port({
    id: "hong_kong", name: "Hong Kong (Kwai Tsing)", modern_reference_name: "Hong Kong", latitude: 22.34, longitude: 114.12,
    historical_polity: "Hong Kong SAR, China", polity_id: null, country: "China (Hong Kong SAR)",
    historical_significance: "Historic entrepôt and major transhipment port; the Kwai Tsing container terminals handle most of its throughput.",
    supplies: ["electronics", "consumer_goods", "garments"], demands: ["refrigerated_food", "machinery", "paper_pulp"],
    default_access: "open", lane_nodes: ["pearl_river"], sources: ["src_unctad_rmt"], size: "hub", fee_modifier: 1.1,
  }),
  port({
    id: "busan", name: "Busan", modern_reference_name: "Busan", latitude: 35.08, longitude: 128.83,
    historical_polity: "South Korea", polity_id: null, country: "South Korea",
    historical_significance: "South Korea's largest port and a leading north-east Asian transhipment hub, with the Busan New Port west of the old harbour.",
    supplies: ["auto_parts", "machinery", "electronics", "chemicals"], demands: ["refrigerated_food", "consumer_goods", "garments"],
    default_access: "open", lane_nodes: ["korea_strait"], sources: ["src_unctad_rmt"], size: "hub",
  }),
  port({
    id: "rotterdam", name: "Rotterdam", modern_reference_name: "Rotterdam", latitude: 51.95, longitude: 4.08,
    historical_polity: "Netherlands", polity_id: null, country: "Netherlands",
    historical_significance: "Europe's largest seaport, stretching from the city to the Maasvlakte terminals on the North Sea.",
    supplies: ["chemicals", "machinery", "consumer_goods"], demands: ["electronics", "garments", "furniture", "palm_oil"],
    default_access: "open", lane_nodes: ["north_sea_s"], sources: ["src_port_of_rotterdam"], size: "hub", fee_modifier: 1.2,
  }),
  port({
    id: "hamburg", name: "Hamburg", modern_reference_name: "Hamburg", latitude: 53.53, longitude: 9.93,
    historical_polity: "Germany", polity_id: null, country: "Germany",
    historical_significance: "Germany's largest port, reached by 100 km of the river Elbe; a major gateway for central Europe.",
    supplies: ["machinery", "auto_parts", "chemicals"], demands: ["electronics", "garments", "consumer_goods", "furniture"],
    default_access: "open", lane_nodes: ["elbe_mouth"], sources: ["src_unctad_rmt"], size: "major", fee_modifier: 1.2,
  }),
  port({
    id: "los_angeles", name: "Los Angeles", modern_reference_name: "Los Angeles", latitude: 33.74, longitude: -118.26,
    historical_polity: "United States", polity_id: null, country: "United States",
    historical_significance: "The busiest container port in the Americas, sharing San Pedro Bay with the Port of Long Beach.",
    supplies: ["paper_pulp", "refrigerated_food", "machinery"], demands: ["electronics", "garments", "furniture", "consumer_goods", "auto_parts"],
    default_access: "open", lane_nodes: ["la_approach"], sources: ["src_unctad_rmt"], size: "hub", fee_modifier: 1.25,
  }),
  port({
    id: "new_york", name: "New York / New Jersey", modern_reference_name: "Port of New York and New Jersey", latitude: 40.68, longitude: -74.15,
    historical_polity: "United States", polity_id: null, country: "United States",
    historical_significance: "The largest port on the US East Coast, with major terminals at Port Newark–Elizabeth.",
    supplies: ["paper_pulp", "machinery", "chemicals"], demands: ["electronics", "garments", "furniture", "consumer_goods"],
    default_access: "open", lane_nodes: ["new_york_approach"], sources: ["src_unctad_rmt"], size: "hub", fee_modifier: 1.25,
  }),
  port({
    id: "jebel_ali", name: "Jebel Ali", modern_reference_name: "Dubai (Jebel Ali)", latitude: 25.01, longitude: 55.06,
    historical_polity: "United Arab Emirates", polity_id: null, country: "United Arab Emirates",
    historical_significance: "The largest port in the Middle East and the principal transhipment hub for the Gulf, built from the 1970s on an artificial harbour.",
    supplies: ["chemicals", "consumer_goods", "machinery"], demands: ["electronics", "refrigerated_food", "garments", "furniture"],
    default_access: "open", lane_nodes: ["gulf_south"], sources: ["src_unctad_rmt"], size: "hub",
  }),
  port({
    id: "mumbai_jnpt", name: "Mumbai (Nhava Sheva)", modern_reference_name: "Jawaharlal Nehru Port, Navi Mumbai", latitude: 18.95, longitude: 72.95,
    historical_polity: "India", polity_id: null, country: "India",
    historical_significance: "India's largest container port, across the harbour from Mumbai island.",
    supplies: ["garments", "chemicals", "machinery", "refrigerated_food"], demands: ["electronics", "machinery", "consumer_goods"],
    default_access: "open", lane_nodes: ["konkan"], sources: ["src_unctad_rmt"], size: "major",
  }),
  port({
    id: "colombo", name: "Colombo", modern_reference_name: "Colombo", latitude: 6.95, longitude: 79.85,
    historical_polity: "Sri Lanka", polity_id: null, country: "Sri Lanka",
    historical_significance: "A transhipment hub astride the main east–west shipping lane across the Indian Ocean.",
    supplies: ["garments", "refrigerated_food", "rubber_products"], demands: ["consumer_goods", "machinery", "chemicals"],
    default_access: "open", lane_nodes: ["colombo_offshore"], sources: ["src_unctad_rmt"], size: "major",
  }),
  port({
    id: "mombasa", name: "Mombasa", modern_reference_name: "Mombasa", latitude: -4.06, longitude: 39.65,
    historical_polity: "Kenya", polity_id: null, country: "Kenya",
    historical_significance: "East Africa's largest port, serving Kenya and landlocked neighbours such as Uganda.",
    supplies: ["refrigerated_food", "paper_pulp"], demands: ["consumer_goods", "machinery", "electronics", "garments"],
    default_access: "open", lane_nodes: ["mombasa_offshore"], sources: ["src_unctad_rmt"], size: "regional",
  }),
  port({
    id: "alexandria", name: "Alexandria", modern_reference_name: "Alexandria", latitude: 31.19, longitude: 29.87,
    historical_polity: "Egypt", polity_id: null, country: "Egypt",
    historical_significance: "Egypt's principal Mediterranean port, founded in antiquity and still handling most of the country's trade alongside El Dekheila.",
    supplies: ["chemicals", "refrigerated_food"], demands: ["machinery", "consumer_goods", "electronics", "paper_pulp"],
    default_access: "open", lane_nodes: ["levant"], sources: ["src_unctad_rmt"], size: "regional",
  }),
  port({
    id: "istanbul", name: "Istanbul (Ambarlı)", modern_reference_name: "Istanbul", latitude: 40.97, longitude: 28.68,
    historical_polity: "Türkiye", polity_id: null, country: "Türkiye",
    historical_significance: "Türkiye's busiest container complex, on the Marmara shore west of the city.",
    supplies: ["garments", "furniture", "machinery"], demands: ["electronics", "chemicals", "consumer_goods"],
    default_access: "open", lane_nodes: ["marmara"], sources: ["src_unctad_rmt"], size: "regional",
  }),
  port({
    id: "marseille", name: "Marseille-Fos", modern_reference_name: "Marseille", latitude: 43.40, longitude: 4.90,
    historical_polity: "France", polity_id: null, country: "France",
    historical_significance: "France's largest port; container traffic is concentrated at Fos-sur-Mer west of the old harbour.",
    supplies: ["chemicals", "machinery", "consumer_goods"], demands: ["electronics", "garments", "furniture"],
    default_access: "open", lane_nodes: ["gulf_of_lion"], sources: ["src_unctad_rmt"], size: "regional", fee_modifier: 1.15,
  }),
  port({
    id: "santos", name: "Santos", modern_reference_name: "Santos", latitude: -23.95, longitude: -46.30,
    historical_polity: "Brazil", polity_id: null, country: "Brazil",
    historical_significance: "Latin America's busiest container port, serving São Paulo.",
    supplies: ["refrigerated_food", "paper_pulp", "auto_parts"], demands: ["electronics", "machinery", "chemicals", "consumer_goods"],
    default_access: "open", lane_nodes: ["brazil_se"], sources: ["src_unctad_rmt"], size: "major",
  }),
  port({
    id: "sydney", name: "Sydney (Port Botany)", modern_reference_name: "Sydney", latitude: -33.97, longitude: 151.22,
    historical_polity: "Australia", polity_id: null, country: "Australia",
    historical_significance: "Australia's second-largest container port, in Botany Bay south of the city.",
    supplies: ["refrigerated_food", "paper_pulp"], demands: ["electronics", "furniture", "consumer_goods", "machinery", "auto_parts"],
    default_access: "open", lane_nodes: ["sydney_offshore"], sources: ["src_unctad_rmt"], size: "major", fee_modifier: 1.2,
  }),
];
