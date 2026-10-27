"use client";

import { create } from "zustand";
import { getCatalog, type ScenarioCatalog } from "@/data";
import type { PortInfrastructureKind } from "@/data/schemas";
import * as rules from "@/engine/game";
import { performRivalAction, type RivalAction } from "@/engine/rivals";
import type { GameEvent, NewGameOptions } from "@/engine/game";
import { parseState, summarizeState } from "@/engine/save";
import type { GameState, SaveSummary, ShipState } from "@/engine/state";
import { getPersistence } from "@/persistence";

/**
 * Zustand store wrapping the pure rules in `src/engine/game.ts`. Components read slices of
 * `state`; actions call a rule, replace `state`, and surface any TransactionError as a
 * toast message instead of throwing into React.
 */

export interface Toast {
  id: string;
  kind: "info" | "success" | "warning" | "error" | "event";
  title: string;
  message?: string;
  created: number;
}

interface GameStore {
  state: GameState | null;
  catalog: ScenarioCatalog | null;
  saves: SaveSummary[];
  loadingSaves: boolean;
  lastSavedAt: number | null;
  toasts: Toast[];
  pendingEvents: GameEvent[];

  // lifecycle
  newGame: (options: NewGameOptions) => GameState;
  loadGame: (id: string) => Promise<boolean>;
  continueLatest: () => Promise<boolean>;
  refreshSaves: () => Promise<void>;
  saveGame: () => Promise<boolean>;
  deleteSave: (id: string) => Promise<void>;
  quitToMenu: () => void;

  // simulation
  tick: (realSeconds: number) => void;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setTimeScale: (scale: number) => void;
  consumeEvents: () => GameEvent[];

  // player actions (all validated by the engine)
  setActiveShip: (shipId: string) => void;
  setControls: (shipId: string, controls: Partial<Pick<ShipState, "throttle" | "rudder" | "autopilot">>) => void;
  setDestination: (shipId: string, portId: string) => boolean;
  depart: (shipId: string) => boolean;
  acceptContract: (contractId: string, shipId: string) => boolean;
  abandonContract: (contractId: string) => boolean;
  buyCargo: (shipId: string, goodId: string, qty: number) => boolean;
  sellCargo: (shipId: string, goodId: string, qty: number) => boolean;
  refuel: (shipId: string, amount: number) => boolean;
  repair: (shipId: string) => boolean;
  buyShip: (classId: string, name: string, portId: string) => boolean;
  sellShip: (shipId: string) => boolean;
  renameShip: (shipId: string, name: string) => void;
  developPort: (portId: string, kind: PortInfrastructureKind) => boolean;
  research: (techId: string) => boolean;
  diplomacy: (polityId: string, action: rules.DiplomaticAction) => boolean;
  rivalAction: (rivalId: string, action: RivalAction) => boolean;
  ensureContracts: (portId: string) => void;
  dismissReport: () => void;
  markNotificationsRead: () => void;
  dismissTutorial: () => void;

  pushToast: (toast: Omit<Toast, "id" | "created">) => void;
  dismissToast: (id: string) => void;
}

let toastCounter = 0;

export const useGameStore = create<GameStore>()((set, get) => {
  /** Run a rule that may throw a TransactionError; report failures as toasts. */
  const apply = (fn: (catalog: ScenarioCatalog, state: GameState) => GameState, successToast?: Omit<Toast, "id" | "created">): boolean => {
    const { state, catalog } = get();
    if (!state || !catalog) return false;
    try {
      const next = fn(catalog, state);
      set({ state: next });
      if (successToast) get().pushToast(successToast);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      get().pushToast({ kind: "error", title: "Not possible", message });
      return false;
    }
  };

  return {
    state: null,
    catalog: null,
    saves: [],
    loadingSaves: false,
    lastSavedAt: null,
    toasts: [],
    pendingEvents: [],

    newGame: (options) => {
      const state = rules.createNewGame(options);
      set({ state, catalog: getCatalog(state.scenario_id), pendingEvents: [] });
      void get().saveGame();
      return state;
    },

    loadGame: async (id) => {
      const raw = await getPersistence().load(id);
      if (!raw) {
        get().pushToast({ kind: "error", title: "Save not found", message: "The save could not be read." });
        return false;
      }
      const result = parseState(raw);
      if (!result.ok) {
        get().pushToast({ kind: "error", title: "Corrupted save", message: result.error });
        return false;
      }
      const state = { ...result.state, paused: true };
      set({ state, catalog: getCatalog(state.scenario_id), pendingEvents: [] });
      return true;
    },

    continueLatest: async () => {
      await get().refreshSaves();
      const latest = get().saves[0];
      if (!latest) return false;
      return get().loadGame(latest.id);
    },

    refreshSaves: async () => {
      set({ loadingSaves: true });
      try {
        const saves = await getPersistence().list();
        set({ saves });
      } finally {
        set({ loadingSaves: false });
      }
    },

    saveGame: async () => {
      const { state } = get();
      if (!state) return false;
      try {
        const stamped = { ...state, updated_at: new Date().toISOString() };
        await getPersistence().save(summarizeState(stamped), stamped);
        set({ lastSavedAt: Date.now(), state: stamped });
        return true;
      } catch (err) {
        get().pushToast({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : String(err) });
        return false;
      }
    },

    deleteSave: async (id) => {
      await getPersistence().remove(id);
      await get().refreshSaves();
      if (get().state?.id === id) set({ state: null, catalog: null });
    },

    quitToMenu: () => set({ state: null, catalog: null, pendingEvents: [] }),

    tick: (realSeconds) => {
      const { state, catalog } = get();
      if (!state || !catalog || state.paused) return;
      const dtSim = Math.min(realSeconds, 0.25) * state.time_scale;
      const result = rules.tickGame(catalog, state, dtSim);
      if (result.events.length > 0) {
        set({ state: result.state, pendingEvents: [...get().pendingEvents, ...result.events] });
        for (const e of result.events) {
          if (e.type === "objective_completed") get().pushToast({ kind: "success", title: "Objective complete", message: e.objective.title });
          if (e.type === "historical_event") get().pushToast({ kind: "event", title: e.event.title, message: `${e.event.date_or_date_range.start}: documented event. Simulated consequences applied where noted.` });
          if (e.type === "endurance_empty") get().pushToast({ kind: "warning", title: "Endurance exhausted", message: "A ship has run out of fuel or provisions." });
        }
      } else {
        set({ state: result.state });
      }
    },

    setPaused: (paused) => {
      const { state } = get();
      if (state) set({ state: rules.setPaused(state, paused) });
    },
    togglePaused: () => {
      const { state } = get();
      if (state) set({ state: rules.setPaused(state, !state.paused) });
    },
    setTimeScale: (scale) => {
      const { state } = get();
      if (state) set({ state: rules.setTimeScale(state, scale) });
    },
    consumeEvents: () => {
      const events = get().pendingEvents;
      if (events.length > 0) set({ pendingEvents: [] });
      return events;
    },

    setActiveShip: (shipId) => {
      const { state } = get();
      if (state) set({ state: rules.setActiveShip(state, shipId) });
    },
    setControls: (shipId, controls) => {
      const { state } = get();
      if (state) set({ state: rules.setShipControls(state, shipId, controls) });
    },
    setDestination: (shipId, portId) => apply((c, s) => rules.setDestination(c, s, shipId, portId)),
    depart: (shipId) => apply((c, s) => rules.departShip(c, s, shipId), { kind: "info", title: "Under way", message: "The ship has left port on autopilot." }),
    acceptContract: (contractId, shipId) => apply((c, s) => rules.acceptContract(c, s, contractId, shipId), { kind: "success", title: "Contract accepted", message: "Cargo loaded. Set the destination and depart." }),
    abandonContract: (contractId) => apply((c, s) => rules.abandonContract(c, s, contractId)),
    buyCargo: (shipId, goodId, qty) => apply((c, s) => rules.buyCargo(c, s, shipId, goodId, qty)),
    sellCargo: (shipId, goodId, qty) => apply((c, s) => rules.sellCargo(c, s, shipId, goodId, qty)),
    refuel: (shipId, amount) => apply((c, s) => rules.refuelShip(c, s, shipId, amount)),
    repair: (shipId) => apply((c, s) => rules.repairShip(c, s, shipId)),
    buyShip: (classId, name, portId) => apply((c, s) => rules.buyShip(c, s, classId, name, portId)),
    sellShip: (shipId) => apply((c, s) => rules.sellShip(c, s, shipId), { kind: "info", title: "Vessel sold" }),
    renameShip: (shipId, name) => {
      const { state } = get();
      if (state) set({ state: rules.renameShip(state, shipId, name) });
    },
    developPort: (portId, kind) => apply((c, s) => rules.developPort(c, s, portId, kind), { kind: "success", title: "Construction complete" }),
    research: (techId) => apply((c, s) => rules.researchTechnology(c, s, techId)),
    diplomacy: (polityId, action) => apply((c, s) => rules.performDiplomacy(c, s, polityId, action)),
    rivalAction: (rivalId, action) => apply((c, s) => performRivalAction(c, s, rivalId, action)),
    ensureContracts: (portId) => {
      const { state, catalog } = get();
      if (!state || !catalog) return;
      const next = rules.ensureContracts(catalog, state, portId);
      if (next !== state) set({ state: next });
    },
    dismissReport: () => {
      const { state } = get();
      if (state) set({ state: rules.dismissReport(state) });
    },
    markNotificationsRead: () => {
      const { state } = get();
      if (state) set({ state: rules.markNotificationsRead(state) });
    },
    dismissTutorial: () => {
      const { state } = get();
      if (state) set({ state: { ...state, tutorial: { ...state.tutorial, dismissed: true } } });
    },

    pushToast: (toast) => {
      const id = `toast_${++toastCounter}`;
      set({ toasts: [...get().toasts.slice(-4), { ...toast, id, created: Date.now() }] });
    },
    dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  };
});

/** Convenience selectors. */
export const selectActiveShip = (s: GameStore): ShipState | null => {
  const st = s.state;
  if (!st || !st.active_ship_id) return null;
  return st.ships[st.active_ship_id] ?? null;
};
