import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { CEOContextBuilder } from "@/lib/ceo-context-builder";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RunContext {
  issueId: string;
  agentId: string;
  instructions: string;
  runId: string;
  /** When set, a scoped CEO context block is prepended to the system prompt. */
  clientId?: string;
}

export async function executeAgentRun(ctx: RunContext): Promise<void> {
  const { instructions, runId, clientId } = ctx;

  // Prepend client-scoped CEO context when a clientId is present
  let systemPrompt: string | undefined;
  if (clientId) {
    const ceoCtx = await CEOContextBuilder.build(clientId);
    systemPrompt = CEOContextBuilder.renderSystemPrompt(ceoCtx);
  }

  try {
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8096,
      stream: true,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: instructions }],
    });

    let output = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        output += event.delta.text;
        // Update run output incrementally
        await db.from("runs").update({ output }).eq("id", runId);
      }
    }

    await db.from("runs")
      .update({ status: "completed", output, finished_at: new Date().toISOString() })
      .eq("id", runId);
  } catch (error) {
    await db.from("runs")
      .update({
        status: "failed",
        output: error instanceof Error ? error.message : "Unknown error",
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    throw error;
  }
}
