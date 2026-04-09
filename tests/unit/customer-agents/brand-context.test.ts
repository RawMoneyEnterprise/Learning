/**
 * Unit tests for BrandContextService (CXM-22)
 *
 * Tests the real implementation from @/lib/brand-context-service.
 * BrandContextService uses an in-memory Map, so no Prisma mock is needed.
 * Uses unique clientIds per test to avoid inter-test state leakage.
 *
 * Architecture reference: CXM-19#document-plan
 */

import { describe, it, expect } from "vitest";
import { BrandContextService } from "@/lib/brand-context-service";

// Each test uses a unique suffix to avoid shared in-memory state
let counter = 0;
function uniqueClientId(label: string) {
  return `test-${label}-${++counter}`;
}

describe("BrandContextService", () => {
  // ── getBrandContext: missing brand ─────────────────────────────────────────

  describe("getBrandContext — missing brand", () => {
    it("returns isEmpty=true when no brand is set for the client", async () => {
      const clientId = uniqueClientId("missing");

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.isEmpty).toBe(true);
    });

    it("returns correct clientId in empty context", async () => {
      const clientId = uniqueClientId("empty-id");

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.clientId).toBe(clientId);
    });

    it("returns null voice/tone/guidelines in empty context", async () => {
      const clientId = uniqueClientId("empty-fields");

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.voice).toBeNull();
      expect(result.tone).toBeNull();
      expect(result.guidelines).toBeNull();
    });

    it("does NOT return another client's brand when own brand is unset", async () => {
      const clientA = uniqueClientId("fallback-A");
      const clientB = uniqueClientId("fallback-B");

      // Set brand only for B
      await BrandContextService.setBrandContext(clientB, {
        voice: "Bold",
        tone: "Direct",
      });

      const resultA = await BrandContextService.getBrandContext(clientA);

      expect(resultA.isEmpty).toBe(true);
      expect(resultA.voice).toBeNull();
    });
  });

  // ── getBrandContext: stored brand ──────────────────────────────────────────

  describe("getBrandContext — stored brand", () => {
    it("returns the brand that was set for the client", async () => {
      const clientId = uniqueClientId("stored");

      await BrandContextService.setBrandContext(clientId, {
        voice: "Conversational",
        tone: "Friendly",
        guidelines: "Use short sentences.",
      });

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.isEmpty).toBe(false);
      expect(result.voice).toBe("Conversational");
      expect(result.tone).toBe("Friendly");
      expect(result.guidelines).toBe("Use short sentences.");
    });

    it("returns correct clientId in non-empty context", async () => {
      const clientId = uniqueClientId("stored-id");
      await BrandContextService.setBrandContext(clientId, { voice: "X" });

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.clientId).toBe(clientId);
    });
  });

  // ── Key isolation ──────────────────────────────────────────────────────────

  describe("key isolation", () => {
    it("Client A and Client B brand contexts are fully independent", async () => {
      const clientA = uniqueClientId("iso-A");
      const clientB = uniqueClientId("iso-B");

      await BrandContextService.setBrandContext(clientA, { voice: "Authoritative" });
      await BrandContextService.setBrandContext(clientB, { voice: "Playful" });

      const [resultA, resultB] = await Promise.all([
        BrandContextService.getBrandContext(clientA),
        BrandContextService.getBrandContext(clientB),
      ]);

      expect(resultA.voice).toBe("Authoritative");
      expect(resultB.voice).toBe("Playful");
      expect(resultA.voice).not.toBe(resultB.voice);
    });

    it("updating Client A's brand does not affect Client B", async () => {
      const clientA = uniqueClientId("update-A");
      const clientB = uniqueClientId("update-B");

      await BrandContextService.setBrandContext(clientA, { voice: "Original A" });
      await BrandContextService.setBrandContext(clientB, { voice: "Original B" });

      // Update A
      await BrandContextService.setBrandContext(clientA, { voice: "Updated A" });

      const resultB = await BrandContextService.getBrandContext(clientB);
      expect(resultB.voice).toBe("Original B");
    });
  });

  // ── setBrandContext: partial updates ──────────────────────────────────────

  describe("setBrandContext — partial updates", () => {
    it("only updates fields that are provided", async () => {
      const clientId = uniqueClientId("partial");

      await BrandContextService.setBrandContext(clientId, {
        voice: "Voice1",
        tone: "Tone1",
      });
      // Update only voice
      await BrandContextService.setBrandContext(clientId, { voice: "Voice2" });

      const result = await BrandContextService.getBrandContext(clientId);

      expect(result.voice).toBe("Voice2");
      expect(result.tone).toBe("Tone1"); // unchanged
    });
  });
});
