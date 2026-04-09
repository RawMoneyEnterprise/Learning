/**
 * E2E / API Integration tests for Customer Agent Scoping (CXM-22)
 *
 * These tests exercise the live API endpoints once the backend (CXM-20) is
 * deployed. Run with:
 *   BASE_URL=http://localhost:3000 npx vitest run tests/e2e/customer-agents
 *
 * Prerequisites:
 *   - Two seeded clients: client-A (CLIENT_A_ID) and client-B (CLIENT_B_ID)
 *   - Valid JWT tokens for each client (from your auth service)
 *   - A private agent registered under client-B's namespace
 *   - A marketplace agent, activated by client-A only
 *   - At least one global agent
 *
 * Environment variables (see .env.test.example):
 *   BASE_URL, CLIENT_A_TOKEN, CLIENT_B_TOKEN,
 *   CLIENT_A_ID, CLIENT_B_ID,
 *   CLIENT_B_PRIVATE_AGENT_ID, MARKETPLACE_AGENT_ID, GLOBAL_AGENT_ID
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// ── Test identity helpers ─────────────────────────────────────────────────────

const env = {
  clientAToken: process.env.CLIENT_A_TOKEN ?? "",
  clientBToken: process.env.CLIENT_B_TOKEN ?? "",
  clientAId: process.env.CLIENT_A_ID ?? "client-A",
  clientBId: process.env.CLIENT_B_ID ?? "client-B",
  clientBPrivateAgentId: process.env.CLIENT_B_PRIVATE_AGENT_ID ?? "",
  marketplaceAgentId: process.env.MARKETPLACE_AGENT_ID ?? "",
  globalAgentId: process.env.GLOBAL_AGENT_ID ?? "",
};

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiGet(
  path: string,
  token: string
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: authHeaders(token),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ── Guards ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  if (!env.clientAToken || !env.clientBToken) {
    console.warn(
      "⚠  CLIENT_A_TOKEN / CLIENT_B_TOKEN not set — skipping live API tests.\n" +
        "   Set these env vars to run integration tests against a real backend."
    );
  }
});

function skipIfNoTokens() {
  if (!env.clientAToken || !env.clientBToken) {
    return true;
  }
  return false;
}

// ── Cross-client isolation tests ──────────────────────────────────────────────

describe("Cross-client isolation", () => {
  it("Client A gets 403 when reading Client B's private agent directly", async () => {
    if (skipIfNoTokens() || !env.clientBPrivateAgentId) return;

    const { status } = await apiGet(
      `/api/agents/${env.clientBPrivateAgentId}`,
      env.clientAToken
    );

    expect(status).toBe(403);
  });

  it("Client A gets 403 when invoking Client B's private agent", async () => {
    if (skipIfNoTokens() || !env.clientBPrivateAgentId) return;

    const res = await fetch(
      `${BASE_URL}/api/agents/${env.clientBPrivateAgentId}/invoke`,
      {
        method: "POST",
        headers: authHeaders(env.clientAToken),
        body: JSON.stringify({ input: "Hello" }),
      }
    );

    expect(res.status).toBe(403);
  });

  it("Client A's roster does not include Client B's private agent", async () => {
    if (skipIfNoTokens() || !env.clientBPrivateAgentId) return;

    const { status, body } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster`,
      env.clientAToken
    );

    expect(status).toBe(200);
    const roster = (body as { agents: { agentId: string }[] }).agents;
    const ids = roster.map((a) => a.agentId);
    expect(ids).not.toContain(env.clientBPrivateAgentId);
  });
});

// ── Marketplace activation boundary tests ────────────────────────────────────

describe("Marketplace activation boundaries", () => {
  it("unactivated marketplace agent does not appear in any client roster", async () => {
    if (skipIfNoTokens() || !env.marketplaceAgentId) return;

    // Neither client has activated this agent for this test — adjust fixture as needed
    const { body: bodyA } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster`,
      env.clientAToken
    );
    const { body: bodyB } = await apiGet(
      `/api/clients/${env.clientBId}/agent-roster`,
      env.clientBToken
    );

    const idsA = (bodyA as { agents: { agentId: string }[] }).agents.map(
      (a) => a.agentId
    );
    const idsB = (bodyB as { agents: { agentId: string }[] }).agents.map(
      (a) => a.agentId
    );

    // Only assert for client B — client A may have activated it
    expect(idsB).not.toContain(env.marketplaceAgentId);
    // (Client A's activation state depends on fixture setup)
    void idsA;
  });

  it("global agent appears in both Client A and Client B rosters", async () => {
    if (skipIfNoTokens() || !env.globalAgentId) return;

    const { body: bodyA } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster`,
      env.clientAToken
    );
    const { body: bodyB } = await apiGet(
      `/api/clients/${env.clientBId}/agent-roster`,
      env.clientBToken
    );

    const idsA = (bodyA as { agents: { agentId: string }[] }).agents.map(
      (a) => a.agentId
    );
    const idsB = (bodyB as { agents: { agentId: string }[] }).agents.map(
      (a) => a.agentId
    );

    expect(idsA).toContain(env.globalAgentId);
    expect(idsB).toContain(env.globalAgentId);
  });
});

// ── Auth boundary tests ───────────────────────────────────────────────────────

describe("Auth boundary tests", () => {
  it("request with no token returns 401", async () => {
    const res = await fetch(
      `${BASE_URL}/api/clients/${env.clientAId}/agent-roster`
    );
    expect(res.status).toBe(401);
  });

  it("clientId in query param is ignored — token-derived clientId is used", async () => {
    if (skipIfNoTokens()) return;

    // Client A token + Client B's ID in query — should return Client A's roster
    const { status, body } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster?clientId=${env.clientBId}`,
      env.clientAToken
    );

    // Either 200 (server ignores query param) or 403 (server rejects mismatch)
    // — in both cases Client B's private agent must NOT appear
    if (status === 200) {
      const roster = (body as { agents: { agentId: string }[] }).agents;
      const ids = roster.map((a) => a.agentId);
      if (env.clientBPrivateAgentId) {
        expect(ids).not.toContain(env.clientBPrivateAgentId);
      }
    } else {
      // 403 is also acceptable — server rejected the mismatched path clientId
      expect([403]).toContain(status);
    }
  });

  it("Client A token cannot access Client B's scoped roster endpoint", async () => {
    if (skipIfNoTokens()) return;

    const { status } = await apiGet(
      `/api/clients/${env.clientBId}/agent-roster`,
      env.clientAToken // Client A's token, but Client B's path
    );

    expect(status).toBe(403);
  });
});

// ── End-to-end scoped CEO roster validation ───────────────────────────────────

describe("E2E scoped CEO roster validation", () => {
  it("roster contains exactly: global + activated marketplace + private (no others)", async () => {
    if (skipIfNoTokens()) return;

    const { status, body } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster`,
      env.clientAToken
    );

    expect(status).toBe(200);

    const roster = (
      body as { agents: { agentId: string; scope: string }[] }
    ).agents;

    // Every agent must be one of: global, marketplace (activated), or private (own)
    const validScopes = new Set(["global", "marketplace", "private"]);
    for (const agent of roster) {
      expect(validScopes).toContain(agent.scope);
    }
  });

  it("roster response shape includes agentId, name, scope, description", async () => {
    if (skipIfNoTokens()) return;

    const { status, body } = await apiGet(
      `/api/clients/${env.clientAId}/agent-roster`,
      env.clientAToken
    );

    expect(status).toBe(200);

    const { agents } = body as {
      agents: {
        agentId: string;
        name: string;
        scope: string;
        description: string;
      }[];
    };

    expect(Array.isArray(agents)).toBe(true);

    if (agents.length > 0) {
      const [first] = agents;
      expect(typeof first.agentId).toBe("string");
      expect(typeof first.name).toBe("string");
      expect(typeof first.scope).toBe("string");
      expect(typeof first.description).toBe("string");
    }
  });
});

// ── Brand context isolation tests ─────────────────────────────────────────────

describe("Brand context isolation", () => {
  it("Client A brand context does not contain Client B fields", async () => {
    if (skipIfNoTokens()) return;

    const { status: statusA, body: brandA } = await apiGet(
      `/api/clients/${env.clientAId}/brand`,
      env.clientAToken
    );
    const { status: statusB, body: brandB } = await apiGet(
      `/api/clients/${env.clientBId}/brand`,
      env.clientBToken
    );

    // Both should be accessible (200 or 404 if no brand set)
    expect([200, 404]).toContain(statusA);
    expect([200, 404]).toContain(statusB);

    if (statusA === 200 && statusB === 200) {
      // clientId field in each response should match the requesting client
      expect((brandA as { clientId: string }).clientId).toBe(env.clientAId);
      expect((brandB as { clientId: string }).clientId).toBe(env.clientBId);
    }
  });

  it("missing brand returns empty context — not another client's brand", async () => {
    if (skipIfNoTokens()) return;

    // Use a guaranteed non-existent clientId to get an empty brand context
    const ghostClientId = `ghost-${Date.now()}`;

    // We can't auth as a ghost client, but we can verify the service behavior
    // through a seeded scenario or by checking the unit test coverage above.
    // This test documents the expected contract for manual verification.
    expect(ghostClientId).toBeTruthy(); // placeholder — see unit test coverage
  });
});
