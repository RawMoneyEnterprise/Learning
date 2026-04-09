import { RosterService, ScopedAgent } from "@/lib/roster-service";
import { BrandContextService, BrandContext } from "@/lib/brand-context-service";

export interface CEOAgentContext {
  clientId: string;
  agentRoster: ScopedAgent[];
  brandContext: BrandContext;
}

/**
 * CEOContextBuilder
 *
 * Assembles the scoped context object passed to the CEO agent at invocation time.
 * The CEO never receives an unfiltered agent list or cross-client brand context.
 */
export class CEOContextBuilder {
  static async build(clientId: string): Promise<CEOAgentContext> {
    const [agentRoster, brandContext] = await Promise.all([
      RosterService.getScopedRoster(clientId),
      BrandContextService.getBrandContext(clientId),
    ]);

    return { clientId, agentRoster, brandContext };
  }

  /**
   * Render the CEO system prompt prefix that includes the scoped context.
   * Callers append task-specific instructions after this block.
   */
  static renderSystemPrompt(ctx: CEOAgentContext): string {
    const rosterLines = ctx.agentRoster
      .map(
        (a) =>
          `- ${a.name} (${a.scope}): ${a.description ?? a.role}${a.title ? ` — ${a.title}` : ""}`
      )
      .join("\n");

    const brandLines = ctx.brandContext.isEmpty
      ? "No brand guidelines configured for this client."
      : [
          ctx.brandContext.voice ? `Voice: ${ctx.brandContext.voice}` : null,
          ctx.brandContext.tone ? `Tone: ${ctx.brandContext.tone}` : null,
          ctx.brandContext.guidelines ? `Guidelines: ${ctx.brandContext.guidelines}` : null,
        ]
          .filter(Boolean)
          .join("\n");

    return `## Client Context
Client ID: ${ctx.clientId}

## Available Agents
${rosterLines || "No agents available."}

## Brand Context
${brandLines}
`;
  }
}
