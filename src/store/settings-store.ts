"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QualityLevel = "low" | "medium" | "high";
export type CameraMode = "chase" | "free" | "overhead";

interface SettingsState {
  quality: QualityLevel;
  camera: CameraMode;
  showTutorialHints: boolean;
  autosave: boolean;
  soundEnabled: boolean;
  units: "nautical" | "metric";
  setQuality: (q: QualityLevel) => void;
  setCamera: (c: CameraMode) => void;
  cycleCamera: () => void;
  setShowTutorialHints: (v: boolean) => void;
  setAutosave: (v: boolean) => void;
  setUnits: (u: "nautical" | "metric") => void;
}

const CAMERA_ORDER: CameraMode[] = ["chase", "free", "overhead"];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      quality: "medium",
      camera: "chase",
      showTutorialHints: true,
      autosave: true,
      soundEnabled: false,
      units: "nautical",
      setQuality: (quality) => set({ quality }),
      setCamera: (camera) => set({ camera }),
      cycleCamera: () => {
        const idx = CAMERA_ORDER.indexOf(get().camera);
        set({ camera: CAMERA_ORDER[(idx + 1) % CAMERA_ORDER.length] ?? "chase" });
      },
      setShowTutorialHints: (showTutorialHints) => set({ showTutorialHints }),
      setAutosave: (autosave) => set({ autosave }),
      setUnits: (units) => set({ units }),
    }),
    { name: "ocean-empire:settings" },
  ),
);
