import { describe, expect, it } from "vitest";
import { ALL_EVENTS, getCatalog } from "@/data";
import { alteredEffects, decideTurningPoint, describeChoice, divergenceOptions, isTurningPoint } from "@/engine/alternate";
import { daysBetween, dateFromIso } from "@/engine/calendar";
import { createNewGame, decideDivergence, tickGame } from "@/engine/game";
import { parseState, serializeState } from "@/engine/save";
import type { GameState } from "@/engine/state";

const DAY = 86_400;

/** Move the clock to a date without simulating the years between (nothing is at sea in these tests). */
function jumpTo(state: GameState, iso: string): GameState {
  const date = dateFromIso(iso);
  return { ...state, date, sim_seconds: daysBetween(state.start_date, date) * DAY + 8 * 3600 };
}

function newGame(rules: "historical" | "sandbox", scenario = "siraf_850"): GameState {
  return createNewGame({ scenario_id: scenario, empire_name: "Test", difficulty: "normal", emblem: { symbol: "x", color: "#fff" }, rules, seed: 11 });
}

/** Advance in day steps until the predicate holds or the limit is reached. */
function advanceUntil(catalog = getCatalog("siraf_850"), state: GameState, done: (s: GameState) => boolean, maxDays = 120) {
  let s = { ...state, paused: false };
  for (let d = 0; d < maxDays && !done(s); d++) s = tickGame(catalog, s, DAY).state;
  return s;
}

const zanj = ALL_EVENTS.find((e) => e.id === "evt_zanj_revolt")!;
const sacked = ALL_EVENTS.find((e) => e.id === "evt_basra_sacked_871")!;
const albuquerque = ALL_EVENTS.find((e) => e.id === "evt_albuquerque_1511")!;
const akhbar = ALL_EVENTS.find((e) => e.id === "evt_akhbar_compiled")!;

describe("alternate-history effects", () => {
  it("recognises turning points and leaves notices alone", () => {
    expect(isTurningPoint(zanj)).toBe(true);
    expect(isTurningPoint(akhbar)).toBe(false);
    expect(divergenceOptions(akhbar)).toEqual(["historical", "averted"]);
    expect(divergenceOptions(albuquerque)).toEqual(["historical", "averted"]);
    expect(divergenceOptions(zanj)).toEqual(["historical", "averted", "softened", "reversed"]);
  });

  it("derives altered effects without touching the record", () => {
    const before = JSON.stringify(zanj);
    expect(alteredEffects(zanj, "historical")).toBe(zanj.effects);
    expect(alteredEffects(zanj, "averted")).toEqual([]);
    expect(alteredEffects(zanj, "softened")).toEqual([{ type: "port_fee_modifier", port_id: "port_basra", multiplier: 1.4 }]);
    expect(alteredEffects(zanj, "reversed")).toEqual([{ type: "port_fee_modifier", port_id: "port_basra", multiplier: 0.56 }]);
    expect(alteredEffects(sacked, "softened")).toEqual([{ type: "port_access", port_id: "port_basra", access: "restricted" }]);
    expect(alteredEffects(sacked, "reversed")).toEqual([{ type: "port_access", port_id: "port_basra", access: "open" }]);
    expect(alteredEffects(albuquerque, "reversed")).toEqual([]);
    expect(JSON.stringify(zanj)).toBe(before);
    expect(describeChoice(getCatalog("siraf_850"), sacked, "averted")).toMatch(/averted/);
    expect(describeChoice(getCatalog("siraf_850"), sacked, "historical")).toMatch(/Basra becomes closed/);
  });
});

describe("sandbox turning points", () => {
  it("historical games apply events without pausing", () => {
    const catalog = getCatalog("siraf_850");
    const s = advanceUntil(catalog, jumpTo(newGame("historical"), "0869-08-20"), (x) => x.applied_events.includes("evt_zanj_revolt"));
    expect(s.applied_events).toContain("evt_zanj_revolt");
    expect(s.alternate_history.pending_event_id).toBeNull();
    expect(s.ports.port_basra!.fee_multiplier).toBe(1.8);
  });

  it("pauses at the first turning point and resumes once decided", () => {
    const catalog = getCatalog("siraf_850");
    const held = advanceUntil(catalog, jumpTo(newGame("sandbox"), "0869-08-20"), (x) => x.alternate_history.pending_event_id !== null);
    expect(held.alternate_history.pending_event_id).toBe("evt_zanj_revolt");
    expect(held.paused).toBe(true);
    expect(held.applied_events).not.toContain("evt_zanj_revolt");
    // Resuming without deciding does not advance the game.
    const stuck = tickGame(catalog, { ...held, paused: false }, DAY).state;
    expect(stuck.sim_seconds).toBe(held.sim_seconds);
    expect(stuck.paused).toBe(true);

    const averted = decideDivergence(catalog, held, "evt_zanj_revolt", "averted");
    expect(averted.paused).toBe(false);
    expect(averted.alternate_history.pending_event_id).toBeNull();
    expect(averted.applied_events).toContain("evt_zanj_revolt");
    expect(averted.ports.port_basra!.fee_multiplier).toBe(1);
    expect(averted.alternate_history.divergences).toHaveLength(1);
    expect(averted.alternate_history.divergences[0]!.choice).toBe("averted");
    expect(averted.notifications[0]!.message).toMatch(/fiction/);
  });

  it("applies the documented consequence when the player lets history happen", () => {
    const catalog = getCatalog("siraf_850");
    const held = advanceUntil(catalog, jumpTo(newGame("sandbox"), "0869-08-20"), (x) => x.alternate_history.pending_event_id !== null);
    const next = decideDivergence(catalog, held, "evt_zanj_revolt", "historical");
    expect(next.ports.port_basra!.fee_multiplier).toBe(1.8);
    expect(next.alternate_history.divergences).toHaveLength(0);
  });

  it("honours decisions set in advance and keeps the altered world consistent", () => {
    const catalog = getCatalog("siraf_850");
    let s = newGame("sandbox");
    s = decideDivergence(catalog, s, "evt_zanj_revolt", "reversed");
    s = decideDivergence(catalog, s, "evt_basra_sacked_871", "reversed");
    expect(s.alternate_history.decisions).toEqual({ evt_zanj_revolt: "reversed", evt_basra_sacked_871: "reversed" });
    s = advanceUntil(catalog, jumpTo(s, "0871-08-25"), (x) => x.applied_events.includes("evt_basra_sacked_871"));
    expect(s.alternate_history.pending_event_id).toBeNull();
    expect(s.ports.port_basra!.access).toBe("open");
    expect(s.alternate_history.divergences.map((d) => d.event_id)).toEqual(["evt_zanj_revolt", "evt_basra_sacked_871"]);
  });

  it("lets a sandbox campaign continue past its historical end unless the ending is allowed", () => {
    const catalog = getCatalog("melaka_1460");
    let s = newGame("sandbox", "melaka_1460");
    // Avert every turning point in advance except the capture of the city, which is left pending.
    for (const e of catalog.events) if (e.id !== "evt_albuquerque_1511" && isTurningPoint(e)) s = decideDivergence(catalog, s, e.id, "averted");
    const held = advanceUntil(catalog, jumpTo(s, "1511-08-10"), (x) => x.alternate_history.pending_event_id !== null);
    expect(held.alternate_history.pending_event_id).toBe("evt_albuquerque_1511");
    expect(held.campaign.status).toBe("active");

    const continued = decideDivergence(catalog, held, "evt_albuquerque_1511", "averted");
    expect(continued.campaign.status).toBe("active");
    const later = advanceUntil(catalog, jumpTo(continued, "1512-12-20"), (x) => x.date.year >= 1513, 30);
    expect(later.campaign.status).toBe("active");
    expect(later.date.year).toBeGreaterThanOrEqual(1513);

    const ended = decideDivergence(catalog, held, "evt_albuquerque_1511", "historical");
    expect(ended.campaign.status).toBe("historical_end");
  });

  it("ignores decisions in historical games and on unknown events", () => {
    const catalog = getCatalog("siraf_850");
    const s = newGame("historical");
    expect(decideTurningPoint(catalog, s, "evt_zanj_revolt", "averted").state).toBe(s);
    expect(decideTurningPoint(catalog, newGame("sandbox"), "evt_nope", "averted").state.alternate_history.decisions).toEqual({});
  });

  it("round-trips through the save format and defaults old saves", () => {
    const catalog = getCatalog("siraf_850");
    const held = advanceUntil(catalog, jumpTo(newGame("sandbox"), "0869-08-20"), (x) => x.alternate_history.pending_event_id !== null);
    const restored = parseState(serializeState(held));
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(restored.state.alternate_history).toEqual(held.alternate_history);
    const legacy = JSON.parse(serializeState(newGame("historical"))) as Record<string, unknown>;
    delete legacy.alternate_history;
    const parsed = parseState(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state.alternate_history).toEqual({ decisions: {}, pending_event_id: null, divergences: [] });
  });
});
