/**
 * Unit tests for PrivateAgentGuard (CXM-22)
 *
 * Tests the real implementation from @/lib/private-agent-guard with a
 * mocked Prisma client. Validates namespace enforcement, audit logging,
 * and error type contracts.
 *
 * Architecture reference: CXM-19#document-plan
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentScope } from "@prisma/client";

// Mock prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    agent: {
      findUnique: vi.fn(),
    },
  },
}));

import { PrivateAgentGuard, ForbiddenError, NotFoundError } from "@/lib/private-agent-guard";
import { prisma } from "@/lib/prisma";

const mockFindUnique = vi.mocked(prisma.agent.findUnique);

// ── Helpers ───────────────────────────────────────────────────────────────────

function stubAgent(scope: AgentScope, clientNamespace: string | null) {
  mockFindUnique.mockResolvedValue({ scope, clientNamespace } as never);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PrivateAgentGuard.check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Cross-client isolation ─────────────────────────────────────────────────

  describe("cross-client isolation", () => {
    it("allows access when clientId matches the private agent namespace", async () => {
      stubAgent(AgentScope.private, "clients/client-A");

      await expect(
        PrivateAgentGuard.check("agt-1", "client-A")
      ).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when Client A tries to access Client B's private agent", async () => {
      stubAgent(AgentScope.private, "clients/client-B");

      await expect(
        PrivateAgentGuard.check("agt-1", "client-A")
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError not a generic Error — callers can distinguish 403 vs 500", async () => {
      stubAgent(AgentScope.private, "clients/client-B");

      const err = await PrivateAgentGuard.check("agt-1", "client-A").catch(
        (e) => e
      );

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.status).toBe(403);
      expect(err.name).toBe("ForbiddenError");
    });

    it("emits an audit log (console.warn) on denied access", async () => {
      stubAgent(AgentScope.private, "clients/client-B");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await PrivateAgentGuard.check("agt-1", "client-A").catch(() => {});

      expect(warnSpy).toHaveBeenCalledOnce();
      const logArg = warnSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logArg);
      expect(parsed.event).toBe("cross_namespace_access_attempt");
      expect(parsed.agentId).toBe("agt-1");
      expect(parsed.requestClientId).toBe("client-A");

      warnSpy.mockRestore();
    });

    it("does NOT emit audit log when access is legitimately granted", async () => {
      stubAgent(AgentScope.private, "clients/client-A");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await PrivateAgentGuard.check("agt-1", "client-A");

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ── Non-private passthrough ────────────────────────────────────────────────

  describe("non-private agent passthrough", () => {
    it("allows access to global agents regardless of clientId", async () => {
      stubAgent(AgentScope.global, null);

      await expect(
        PrivateAgentGuard.check("agt-global", "any-client")
      ).resolves.toBeUndefined();
    });

    it("allows access to marketplace agents (activation enforced at roster level)", async () => {
      stubAgent(AgentScope.marketplace, null);

      await expect(
        PrivateAgentGuard.check("agt-market", "any-client")
      ).resolves.toBeUndefined();
    });
  });

  // ── Agent not found ────────────────────────────────────────────────────────

  describe("agent not found", () => {
    it("throws NotFoundError when the agentId does not exist", async () => {
      mockFindUnique.mockResolvedValue(null as never);

      await expect(
        PrivateAgentGuard.check("nonexistent", "client-A")
      ).rejects.toThrow(NotFoundError);
    });

    it("NotFoundError has status 404", async () => {
      mockFindUnique.mockResolvedValue(null as never);

      const err = await PrivateAgentGuard.check("nonexistent", "client-A").catch(
        (e) => e
      );

      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.status).toBe(404);
    });

    it("does NOT emit audit log for a missing agent", async () => {
      mockFindUnique.mockResolvedValue(null as never);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await PrivateAgentGuard.check("nonexistent", "client-A").catch(() => {});

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ── Namespace format ───────────────────────────────────────────────────────

  describe("namespace format", () => {
    it("requires exact 'clients/{clientId}' — partial prefix match is rejected", async () => {
      stubAgent(AgentScope.private, "clients/client-A-extra");

      await expect(
        PrivateAgentGuard.check("agt-1", "client-A")
      ).rejects.toThrow(ForbiddenError);
    });

    it("is case-sensitive", async () => {
      stubAgent(AgentScope.private, "clients/client-a");

      await expect(
        PrivateAgentGuard.check("agt-1", "Client-A")
      ).rejects.toThrow(ForbiddenError);
    });

    it("constructs expected namespace as 'clients/{clientId}'", async () => {
      // Verify the guard uses the exact namespace format from the ADR
      stubAgent(AgentScope.private, "clients/clt_xyz789");

      await expect(
        PrivateAgentGuard.check("agt-1", "clt_xyz789")
      ).resolves.toBeUndefined();
    });
  });
});
