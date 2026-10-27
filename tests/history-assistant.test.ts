import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildGrounding, groundingPrompt } from "@/lib/history-grounding";
import { GET, POST } from "@/app/api/history-assistant/route";

describe("history assistant grounding", () => {
  it("assembles the entry, related records and bibliography", () => {
    const m = buildGrounding("ports", "port_siraf")!;
    expect(m.title).toBe("Siraf");
    expect(m.record).toContain("historical_significance");
    expect(m.sources.some((s) => s.id === "src_whitehouse_siraf")).toBe(true);
    expect(m.related.some((r) => r.kind === "civilizations")).toBe(true);
  });

  it("strips gameplay tuning from the material", () => {
    const m = buildGrounding("ships", "ship_sewn_ocean")!;
    expect(m.record).not.toContain("max_speed_knots");
    expect(m.record).not.toContain("purchase_cost");
    expect(m.record).toContain("evidence_status");
  });

  it("writes a prompt that forbids outside knowledge and names the evidence rating", () => {
    const m = buildGrounding("events", "evt_basra_sacked_871")!;
    const prompt = groundingPrompt(m);
    expect(prompt).toContain("Use only the material in this prompt");
    expect(prompt).toContain("established");
    expect(prompt).toContain("[src_popovic_zanj]");
  });

  it("returns null for unknown entries", () => {
    expect(buildGrounding("ports", "nowhere")).toBeNull();
    expect(buildGrounding("nonsense", "x")).toBeNull();
  });
});

describe("history assistant route without an API key", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });

  it("reports the assistant as unavailable and refuses questions", async () => {
    const status = await (await GET()).json();
    expect(status.available).toBe(false);
    const res = await POST(new Request("http://localhost/api/history-assistant", { method: "POST", body: JSON.stringify({ type: "ports", id: "port_siraf", question: "Where was Siraf?" }) }));
    expect(res.status).toBe(503);
  });
});
