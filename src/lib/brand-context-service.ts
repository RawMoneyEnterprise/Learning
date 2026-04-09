/**
 * BrandContextService
 *
 * Brand intelligence is always sourced from the client-scoped namespace.
 * There is no global brand fallback — one client's voice never bleeds into another's.
 */

export interface BrandContext {
  clientId: string;
  voice: string | null;
  tone: string | null;
  guidelines: string | null;
  isEmpty: boolean;
}

// In-memory brand store — in production, replace with DB/document store reads.
const brandStore = new Map<string, Omit<BrandContext, "isEmpty" | "clientId">>();

function emptyContext(clientId: string): BrandContext {
  return { clientId, voice: null, tone: null, guidelines: null, isEmpty: true };
}

export class BrandContextService {
  /**
   * Returns brand context for a client.
   * Always reads from `clients/{clientId}/brand` — never falls back to another client.
   */
  static async getBrandContext(clientId: string): Promise<BrandContext> {
    const key = `clients/${clientId}/brand`;
    const stored = brandStore.get(key);
    if (!stored) {
      return emptyContext(clientId);
    }
    return { clientId, ...stored, isEmpty: false };
  }

  /** Upsert brand context for a client (used by admin/setup flows). */
  static async setBrandContext(
    clientId: string,
    data: { voice?: string; tone?: string; guidelines?: string }
  ): Promise<void> {
    const key = `clients/${clientId}/brand`;
    const existing = brandStore.get(key) ?? { voice: null, tone: null, guidelines: null };
    brandStore.set(key, {
      voice: data.voice ?? existing.voice,
      tone: data.tone ?? existing.tone,
      guidelines: data.guidelines ?? existing.guidelines,
    });
  }
}
