/**
 * Unit tests for RosterService (CXM-22)
 *
 * Tests the real implementation from @/lib/roster-service with a mocked
 * Prisma client. Each findMany call is matched by its `where` clause to
 * simulate global / marketplace / private query results independently.
 *
 * Architecture reference: CXM-19#document-plan
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentScope } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agent: {
      findMany: vi.fn(),
    },
  },
}));

import { RosterService } from "@/lib/roster-service";
import { prisma } from "@/lib/prisma";

const mockFindMany = vi.mocked(prisma.agent.findMany);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GLOBAL_AGENT = {
  id: "agt-global-1",
  name: "Copywriter",
  scope: AgentScope.global,
  clientNamespace: null,
  description: "Global copywriting agent",
  title: "Senior Copywriter",
  role: "copywriter",
};

const GLOBAL_AGENT_2 = {
  id: "agt-global-2",
  name: "SEO Specialist",
  scope: AgentScope.global,
  clientNamespace: null,
  description: null,
  title: null,
  role: "seo_specialist",
};

const MARKETPLACE_AGENT = {
  id: "agt-market-1",
  name: "Analytics Bot",
  scope: AgentScope.marketplace,
  clientNamespace: null,
  description: "Third-party analytics agent",
  title: null,
  role: "analytics",
};

function makePrivateAgent(clientId: string, id = "agt-private-1") {
  return {
    id,
    name: `Private Bot ${id}`,
    scope: AgentScope.private,
    clientNamespace: `clients/${clientId}`,
    description: null,
    title: null,
    role: "custom",
  };
}

/**
 * Mock prisma.agent.findMany to return different results based on the
 * `where.scope` clause. Simulates the three parallel queries in RosterService.
 */
function setupFindMany({
  global: globalAgents = [],
  marketplace: marketplaceAgents = [],
  private: privateAgents = [],
}: {
  global?: typeof GLOBAL_AGENT[];
  marketplace?: typeof MARKETPLACE_AGENT[];
  private?: ReturnType<typeof makePrivateAgent>[];
}) {
  mockFindMany.mockImplementation(async ({ where }: { where?: { scope?: AgentScope; clientNamespace?: string; activations?: unknown } } = {}) => {
    if (where?.scope === AgentScope.global) return globalAgents as never;
    if (where?.scope === AgentScope.marketplace) return marketplaceAgents as never;
    if (where?.scope === AgentScope.private) return privateAgents as never;
    return [] as never;
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RosterService.getScopedRoster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the in-memory cache between tests
    RosterService.invalidate("client-A");
    RosterService.invalidate("client-B");
    RosterService.invalidate("client-empty");
    RosterService.invalidate("client-XYZ");
  });

  // ── Roster composition ─────────────────────────────────────────────────────

  describe("roster composition", () => {
    it("returns global + activated marketplace + private agents combined", async () => {
      setupFindMany({
        global: [GLOBAL_AGENT],
        marketplace: [MARKETPLACE_AGENT],
        private: [makePrivateAgent("client-A")],
      });

      const roster = await RosterService.getScopedRoster("client-A");
      const ids = roster.map((a) => a.agentId);

      expect(ids).toContain(GLOBAL_AGENT.id);
      expect(ids).toContain(MARKETPLACE_AGENT.id);
      expect(ids).toContain("agt-private-1");
      expect(roster).toHaveLength(3);
    });

    it("returns only global agents when no marketplace activated and no private agents", async () => {
      setupFindMany({ global: [GLOBAL_AGENT, GLOBAL_AGENT_2] });

      const roster = await RosterService.getScopedRoster("client-A");

      expect(roster).toHaveLength(2);
      expect(roster.every((a) => a.scope === AgentScope.global)).toBe(true);
    });

    it("returns empty roster when no agents exist", async () => {
      setupFindMany({});

      const roster = await RosterService.getScopedRoster("client-empty");

      expect(roster).toHaveLength(0);
    });
  });

  // ── Cross-client isolation ─────────────────────────────────────────────────

  describe("cross-client isolation", () => {
    it("Client A's roster does not include Client B's private agents", async () => {
      const clientBPrivate = makePrivateAgent("client-B", "agt-priv-B");

      // For client-A: no private agents; for client-B: has private agent
      mockFindMany.mockImplementation(async ({ where }: { where?: { scope?: AgentScope; clientNamespace?: string } } = {}) => {
        if (where?.scope === AgentScope.global) return [GLOBAL_AGENT] as never;
        if (where?.scope === AgentScope.marketplace) return [] as never;
        if (where?.scope === AgentScope.private) {
          return (where.clientNamespace === "clients/client-A"
            ? []
            : [clientBPrivate]) as never;
        }
        return [] as never;
      });

      const roster = await RosterService.getScopedRoster("client-A");

      expect(roster.map((a) => a.agentId)).not.toContain(clientBPrivate.id);
    });

    it("queries private agents with 'clients/{clientId}' namespace", async () => {
      setupFindMany({});

      await RosterService.getScopedRoster("client-XYZ");

      const privateCalls = mockFindMany.mock.calls.filter(
        ([{ where }]: [{ where: { scope?: AgentScope; clientNamespace?: string } }]) =>
          where?.scope === AgentScope.private
      );
      expect(privateCalls).toHaveLength(1);
      expect(privateCalls[0][0].where.clientNamespace).toBe("clients/client-XYZ");
    });

    it("Client A's activated marketplace does NOT appear in Client B's roster", async () => {
      // Client A has marketplace agent; Client B doesn't
      mockFindMany.mockImplementation(async ({ where }: { where?: { scope?: AgentScope; activations?: unknown } } = {}) => {
        if (where?.scope === AgentScope.global) return [GLOBAL_AGENT] as never;
        if (where?.scope === AgentScope.marketplace) return [] as never; // B has none activated
        if (where?.scope === AgentScope.private) return [] as never;
        return [] as never;
      });

      const rosterB = await RosterService.getScopedRoster("client-B");

      expect(rosterB.map((a) => a.agentId)).not.toContain(MARKETPLACE_AGENT.id);
    });
  });

  // ── Marketplace activation boundaries ─────────────────────────────────────

  describe("marketplace activation boundaries", () => {
    it("unactivated marketplace agent does not appear in roster", async () => {
      setupFindMany({ global: [GLOBAL_AGENT] }); // marketplace returns []

      const roster = await RosterService.getScopedRoster("client-A");

      expect(roster.map((a) => a.agentId)).not.toContain(MARKETPLACE_AGENT.id);
    });

    it("activated marketplace agent appears in roster", async () => {
      setupFindMany({
        global: [GLOBAL_AGENT],
        marketplace: [MARKETPLACE_AGENT],
      });

      const roster = await RosterService.getScopedRoster("client-A");

      expect(roster.map((a) => a.agentId)).toContain(MARKETPLACE_AGENT.id);
    });

    it("deactivated agent is absent (repo no longer returns it)", async () => {
      // Simulate post-deactivation state: marketplace returns []
      setupFindMany({ global: [GLOBAL_AGENT] });

      RosterService.invalidate("client-A"); // flush cache
      const roster = await RosterService.getScopedRoster("client-A");

      expect(roster.map((a) => a.agentId)).not.toContain(MARKETPLACE_AGENT.id);
    });
  });

  // ── Caching ────────────────────────────────────────────────────────────────

  describe("caching", () => {
    it("returns cached result on second call without re-querying DB", async () => {
      setupFindMany({ global: [GLOBAL_AGENT] });

      await RosterService.getScopedRoster("client-A");
      await RosterService.getScopedRoster("client-A"); // second call

      // findMany called 3 times for first call (global+marketplace+private), 0 for second
      expect(mockFindMany).toHaveBeenCalledTimes(3);
    });

    it("invalidate clears cache so next call re-queries", async () => {
      setupFindMany({ global: [GLOBAL_AGENT] });

      await RosterService.getScopedRoster("client-A");
      RosterService.invalidate("client-A");
      await RosterService.getScopedRoster("client-A");

      // 3 queries on first call + 3 queries after invalidation = 6
      expect(mockFindMany).toHaveBeenCalledTimes(6);
    });
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  describe("response shape", () => {
    it("maps to ScopedAgent shape (agentId, name, scope, description, title, role)", async () => {
      setupFindMany({ global: [GLOBAL_AGENT] });

      const [agent] = await RosterService.getScopedRoster("client-A");

      expect(agent).toMatchObject({
        agentId: GLOBAL_AGENT.id,
        name: GLOBAL_AGENT.name,
        scope: AgentScope.global,
        description: GLOBAL_AGENT.description,
        title: GLOBAL_AGENT.title,
        role: GLOBAL_AGENT.role,
      });
    });

    it("does not expose internal clientNamespace field", async () => {
      setupFindMany({ private: [makePrivateAgent("client-A")] });

      const [agent] = await RosterService.getScopedRoster("client-A");

      expect(agent).not.toHaveProperty("clientNamespace");
    });
  });
});
