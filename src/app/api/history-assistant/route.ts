import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildGrounding, groundingPrompt } from "@/lib/history-grounding";

/**
 * Optional AI history assistant. It explains an encyclopedia entry from the entry's own
 * record and bibliography, nothing else (see history-grounding.ts). The game and the
 * encyclopedia work without it: when no ANTHROPIC_API_KEY is configured this route says
 * so and the page simply omits the assistant.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";

const BodySchema = z.object({
  type: z.string().min(1).max(40),
  id: z.string().min(1).max(80),
  question: z.string().trim().min(3).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(8)
    .default([]),
});

function configured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function GET(): Promise<Response> {
  return Response.json({ available: configured(), model: configured() ? MODEL : null });
}

export async function POST(request: Request): Promise<Response> {
  if (!configured()) {
    return Response.json({ available: false, error: "The history assistant is not enabled on this deployment." }, { status: 503 });
  }
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Ask a question of 3 to 500 characters." }, { status: 400 });
  }
  const material = buildGrounding(body.type, body.id);
  if (!material) return Response.json({ error: "Unknown encyclopedia entry." }, { status: 404 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      // The material is stable per entry, so repeated questions about the same entry reuse the cached prefix.
      system: [{ type: "text", text: groundingPrompt(material), cache_control: { type: "ephemeral" } }],
      messages: [...body.history.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: body.question }],
    });
    if (response.stop_reason === "refusal") {
      return Response.json({ answer: "The assistant declined to answer that. The sources listed on this page remain the place to look.", sources: [] });
    }
    const answer = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const cited = material.sources.filter((s) => answer.includes(`[${s.id}]`)).map((s) => ({ id: s.id, title: s.title }));
    return Response.json({ answer: answer || "The entry does not record anything that answers that question.", sources: cited, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: "The history assistant is not configured correctly on this deployment." }, { status: 503 });
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: "The assistant is busy. Try again in a moment." }, { status: 429 });
    if (error instanceof Anthropic.APIConnectionError) return Response.json({ error: "Could not reach the assistant." }, { status: 502 });
    if (error instanceof Anthropic.APIError) return Response.json({ error: "The assistant could not answer right now." }, { status: 502 });
    throw error;
  }
}
