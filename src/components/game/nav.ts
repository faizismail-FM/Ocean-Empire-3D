import { BookOpen, Building2, Globe2, Handshake, Landmark, ScrollText, Settings, Ship, Store, Swords, Target, Waves } from "lucide-react";
import type { ScenarioCatalog } from "@/data";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Globe2;
  feature?: "diplomacy" | "technology" | "territory";
  /** Only shown when the scenario defines AI trading powers. */
  rivals?: boolean;
  /** Single-key shortcut on the sailing screen (letters not used by the helm). */
  hotkey?: string;
}

/** The game's screens, in sidebar order. Shared by the shell sidebar and the sailing dock. */
export const NAV: NavItem[] = [
  { href: "/play/world", label: "World", icon: Globe2, hotkey: "m" },
  { href: "/play/sail", label: "Sail", icon: Waves },
  { href: "/play/empire", label: "Empire", icon: Landmark, hotkey: "e" },
  { href: "/play/fleet", label: "Fleet", icon: Ship, hotkey: "f" },
  { href: "/play/trade", label: "Trade", icon: Store, hotkey: "t" },
  { href: "/play/ports", label: "Ports", icon: Building2, hotkey: "p" },
  { href: "/play/technology", label: "Technology", icon: ScrollText, feature: "technology", hotkey: "g" },
  { href: "/play/diplomacy", label: "Diplomacy", icon: Handshake, feature: "diplomacy", hotkey: "n" },
  { href: "/play/rivals", label: "Rivals", icon: Swords, rivals: true, hotkey: "v" },
  { href: "/play/history", label: "History", icon: BookOpen, hotkey: "j" },
  { href: "/play/missions", label: "Missions", icon: Target, hotkey: "o" },
  { href: "/play/settings", label: "Settings", icon: Settings },
];

/** Screens available in a scenario: feature-gated screens hide where the scenario lacks the feature. */
export function visibleNav(catalog: ScenarioCatalog): NavItem[] {
  const features = catalog.scenario.features;
  return NAV.filter((n) => (!n.feature || features[n.feature]) && (!n.rivals || catalog.scenario.rivals.length > 0));
}
