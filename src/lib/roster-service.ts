import { db } from "@/lib/db";
import type { AgentScope } from "@/lib/db-helpers";

export type { AgentScope };

export interface ScopedAgent {
  agentId: string;
  name: string;
  scope: AgentScope;
  description: string | null;
  title: string | null;
  role: string;
}

interface AgentRow {
  id: string;
  name: string;
  scope: AgentScope;
  description: string | null;
  title: string | null;
  role: string;
}

function toScopedAgent(agent: AgentRow): ScopedAgent {
  return {
    agentId: agent.id,
    name: agent.name,
    scope: agent.scope,
    description: agent.description,
    title: agent.title,
    role: agent.role,
  };
}

// Simple in-memory cache keyed by clientId
const rosterCache = new Map<string, { data: ScopedAgent[]; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

export class RosterService {
  static invalidate(clientId: string) {
    rosterCache.delete(clientId);
  }

  static async getScopedRoster(clientId: string): Promise<ScopedAgent[]> {
    const cached = rosterCache.get(clientId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Fetch global agents, activated marketplace IDs, and private agents in parallel
    const [globalResult, activationsResult, privateResult] = await Promise.all([
      db.from("agents")
        .select("id, name, scope, description, title, role")
        .eq("scope", "global") as Promise<{ data: AgentRow[] | null }>,

      db.from("client_agent_activations")
        .select("agent_id")
        .eq("client_id", clientId) as Promise<{ data: { agent_id: string }[] | null }>,

      db.from("agents")
        .select("id, name, scope, description, title, role")
        .eq("scope", "private")
        .eq("client_namespace", `clients/${clientId}`) as Promise<{ data: AgentRow[] | null }>,
    ]);

    // Fetch activated marketplace agents by ID (avoids brittle PostgREST join syntax)
    const activatedIds = (activationsResult.data ?? []).map((a) => a.agent_id);
    let marketplaceAgents: AgentRow[] = [];
    if (activatedIds.length > 0) {
      const { data } = await db.from("agents")
        .select("id, name, scope, description, title, role")
        .eq("scope", "marketplace")
        .in("id", activatedIds) as { data: AgentRow[] | null };
      marketplaceAgents = data ?? [];
    }

    const data: ScopedAgent[] = [
      ...(globalResult.data ?? []),
      ...marketplaceAgents,
      ...(privateResult.data ?? []),
    ].map(toScopedAgent);

    rosterCache.set(clientId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }
}
