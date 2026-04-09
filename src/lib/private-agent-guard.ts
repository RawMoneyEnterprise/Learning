import { db } from "@/lib/db";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function auditLog(event: string, data: Record<string, unknown>) {
  // Structured audit log — in production replace with a proper logger/sink
  console.warn(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
}

export class PrivateAgentGuard {
  /**
   * Asserts that requestClientId may access agentId.
   * Throws ForbiddenError (403) if a private agent's namespace doesn't match.
   * Throws NotFoundError (404) if the agent doesn't exist.
   */
  static async check(agentId: string, requestClientId: string): Promise<void> {
    const { data: agent } = await db.from("agents")
      .select("scope, client_namespace")
      .eq("id", agentId)
      .single() as { data: { scope: string; client_namespace: string | null } | null };

    if (!agent) {
      throw new NotFoundError(`Agent ${agentId} not found`);
    }

    if (agent.scope === "private") {
      const expectedNamespace = `clients/${requestClientId}`;
      if (agent.client_namespace !== expectedNamespace) {
        auditLog("cross_namespace_access_attempt", { agentId, requestClientId });
        throw new ForbiddenError("Agent not accessible in this client context");
      }
    }
  }
}
