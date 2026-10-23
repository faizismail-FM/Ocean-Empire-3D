import type { GameState, LedgerCategory, LedgerEntry } from "./state";
import { uid } from "@/lib/utils";

/**
 * Treasury rules. Every change to the treasury goes through `applyTransaction` so that
 * balances cannot go negative unintentionally and every movement is recorded in the ledger.
 */

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

export const LEDGER_LIMIT = 400;

export function canAfford(state: GameState, amount: number): boolean {
  return amount <= 0 || state.treasury >= amount;
}

export interface TransactionOptions {
  ship_id?: string | null;
  port_id?: string | null;
  /** Allow the balance to dip below zero (used only for unavoidable running costs). */
  allow_negative?: boolean;
}

/**
 * Apply a signed amount to the treasury (positive = income, negative = expense).
 * Returns a new state; throws TransactionError when the player cannot afford an expense.
 */
export function applyTransaction(
  state: GameState,
  amount: number,
  category: LedgerCategory,
  description: string,
  options: TransactionOptions = {},
): GameState {
  if (!Number.isFinite(amount)) throw new TransactionError("Invalid amount");
  const rounded = Math.round(amount * 100) / 100;
  if (rounded < 0 && !options.allow_negative && state.treasury + rounded < 0) {
    throw new TransactionError(`Insufficient funds: need ${Math.abs(rounded)}, have ${state.treasury}`);
  }
  if (rounded === 0) return state;
  const entry: LedgerEntry = {
    id: uid("tx"),
    sim_seconds: state.sim_seconds,
    date: state.date,
    amount: rounded,
    category,
    description,
    ship_id: options.ship_id ?? null,
    port_id: options.port_id ?? null,
  };
  const ledger = [...state.ledger, entry];
  if (ledger.length > LEDGER_LIMIT) ledger.splice(0, ledger.length - LEDGER_LIMIT);
  return {
    ...state,
    treasury: Math.round((state.treasury + rounded) * 100) / 100,
    ledger,
    stats: {
      ...state.stats,
      total_revenue: rounded > 0 ? state.stats.total_revenue + rounded : state.stats.total_revenue,
      total_expenses: rounded < 0 ? state.stats.total_expenses + Math.abs(rounded) : state.stats.total_expenses,
    },
  };
}

/** Sum of ledger movements by category over the last `days` simulated days. */
export function summarizeLedger(state: GameState, days: number): { income: number; expenses: number; byCategory: Record<string, number> } {
  const since = state.sim_seconds - days * 86400;
  let income = 0;
  let expenses = 0;
  const byCategory: Record<string, number> = {};
  for (const e of state.ledger) {
    if (e.sim_seconds < since) continue;
    if (e.amount > 0) income += e.amount;
    else expenses += -e.amount;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }
  return { income, expenses, byCategory };
}
