"use client";

import { create } from "zustand";

interface MenuState {
  /** Scenario whose vessel and music the landing page is showing. */
  showcaseId: string | null;
  setShowcase: (id: string) => void;
}

export const useMenuStore = create<MenuState>()((set) => ({
  showcaseId: null,
  setShowcase: (showcaseId) => set({ showcaseId }),
}));
