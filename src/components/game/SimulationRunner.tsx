"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";

const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Drives the simulation clock with requestAnimationFrame while the tab is visible, and
 * autosaves periodically. Mounted once in the play layout so ships keep moving whichever
 * management screen the player is looking at.
 */
export function SimulationRunner() {
  const tick = useGameStore((s) => s.tick);
  const saveGame = useGameStore((s) => s.saveGame);
  const autosave = useSettingsStore((s) => s.autosave);
  const lastRef = useRef<number | null>(null);
  const saveRef = useRef<number>(0);

  useEffect(() => {
    let frame = 0;
    let running = true;
    const loop = (now: number) => {
      if (!running) return;
      if (lastRef.current !== null && document.visibilityState === "visible") {
        const dt = (now - lastRef.current) / 1000;
        if (dt > 0) tick(dt);
      }
      lastRef.current = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const onVisibility = () => {
      lastRef.current = null; // skip the hidden interval instead of fast-forwarding
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick]);

  useEffect(() => {
    if (!autosave) return;
    saveRef.current = Date.now();
    const id = window.setInterval(() => {
      const state = useGameStore.getState().state;
      if (!state) return;
      if (Date.now() - saveRef.current < AUTOSAVE_INTERVAL_MS - 500) return;
      saveRef.current = Date.now();
      void saveGame();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autosave, saveGame]);

  // Save on tab close as a last resort.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void useGameStore.getState().saveGame();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  return null;
}
