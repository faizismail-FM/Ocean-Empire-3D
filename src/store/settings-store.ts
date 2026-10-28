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
  /** Procedural sound: ambience and music. Levels are 0..1. */
  audio: AudioSettings;
  units: "nautical" | "metric";
  setQuality: (q: QualityLevel) => void;
  setCamera: (c: CameraMode) => void;
  cycleCamera: () => void;
  setShowTutorialHints: (v: boolean) => void;
  setAutosave: (v: boolean) => void;
  setUnits: (u: "nautical" | "metric") => void;
  setAudio: (patch: Partial<AudioSettings>) => void;
}

export interface AudioSettings {
  enabled: boolean;
  master: number;
  music: number;
  ambience: number;
}

export const DEFAULT_AUDIO: AudioSettings = { enabled: true, master: 0.7, music: 0.6, ambience: 0.8 };

const CAMERA_ORDER: CameraMode[] = ["chase", "free", "overhead"];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      quality: "medium",
      camera: "chase",
      showTutorialHints: true,
      autosave: true,
      audio: DEFAULT_AUDIO,
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
      setAudio: (patch) => set({ audio: { ...get().audio, ...patch } }),
    }),
    {
      name: "ocean-empire:settings",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return { ...current, ...p, audio: { ...DEFAULT_AUDIO, ...(p.audio ?? {}) } };
      },
    },
  ),
);
