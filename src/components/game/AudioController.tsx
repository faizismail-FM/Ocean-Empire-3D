"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { windForDate } from "@/engine/wind";
import { getAudioEngine, type AudioScene } from "@/lib/audio/engine";
import { getScenario } from "@/data";
import { useGameStore } from "@/store/game-store";
import { useMenuStore } from "@/store/menu-store";
import { useSettingsStore } from "@/store/settings-store";

/**
 * Keeps the procedural sound engine in step with where the player is and what the
 * simulation is doing. Sound can only begin after a user gesture, so the first click or
 * key anywhere on the page starts the engine; until then nothing plays.
 */
export function AudioController() {
  const pathname = usePathname();
  const audio = useSettingsStore((s) => s.audio);

  useEffect(() => {
    const start = () => {
      getAudioEngine().start();
      if (getAudioEngine().started) {
        window.removeEventListener("pointerdown", start);
        window.removeEventListener("keydown", start);
      }
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  useEffect(() => {
    getAudioEngine().setMix(audio);
  }, [audio]);

  useEffect(() => {
    const compute = (): AudioScene => {
      const { state, catalog } = useGameStore.getState();
      const onPlay = pathname.startsWith("/play");
      const mode: AudioScene["mode"] = pathname === "/" || pathname.startsWith("/new") ? "menu" : onPlay && state && catalog ? (pathname.startsWith("/play/sail") ? "sailing" : "management") : "off";
      if (!state || !catalog || mode === "off" || mode === "menu") {
        const showcase = mode === "menu" ? useMenuStore.getState().showcaseId : null;
        const family = (showcase ? getScenario(showcase)?.family : null) ?? catalog?.scenario.family ?? null;
        return { mode, family, docked: true, paused: false, speedKnots: 0, windKnots: 0, throttle: 0, propulsion: null };
      }
      const ship = state.active_ship_id ? state.ships[state.active_ship_id] : undefined;
      const cls = ship ? catalog.ships.find((c) => c.id === ship.class_id) : undefined;
      const wind = catalog.scenario.features.wind ? windForDate(catalog.scenario.wind, state.date.month, state.date.day) : { from: 0, speed_knots: 0 };
      return {
        mode,
        family: catalog.scenario.family,
        docked: !ship || ship.status === "docked",
        paused: state.paused,
        speedKnots: ship?.speed_knots ?? 0,
        windKnots: wind.speed_knots,
        throttle: ship?.throttle ?? 0,
        propulsion: cls?.propulsion ?? null,
      };
    };
    const push = () => getAudioEngine().setScene(compute());
    push();
    let timer: number | null = null;
    const unsub = useGameStore.subscribe(() => {
      if (timer !== null) return;
      timer = window.setTimeout(() => {
        timer = null;
        push();
      }, 400);
    });
    const unsubMenu = useMenuStore.subscribe(push);
    return () => {
      unsub();
      unsubMenu();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
