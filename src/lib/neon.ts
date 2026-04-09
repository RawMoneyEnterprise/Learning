/**
 * Neon Client — Auth + Data API (lazy initialization)
 *
 * Uses @neondatabase/neon-js to create a unified client with:
 * - Neon Auth (session management, sign-in/sign-up/sign-out)
 * - Neon Data API (PostgREST HTTP queries, authenticated via user JWT)
 *
 * Environment variables (optional — only needed when these features are used):
 *   NEON_AUTH_URL      — Neon Auth endpoint (server-side)
 *   NEON_DATA_API_URL  — Neon PostgREST HTTP endpoint (server-side)
 */

import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";

// Use process.env for Next.js server-side compatibility (not import.meta.env which is Vite-only)
const authUrl = process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL ?? "";
const dataApiUrl = process.env.NEON_DATA_API_URL ?? process.env.VITE_NEON_DATA_URL ?? "";

// Lazy singleton — created on first access, not at module load time
let _neon: ReturnType<typeof createClient> | null = null;

function getNeonClient() {
  if (!_neon) {
    if (!authUrl) {
      throw new Error("NEON_AUTH_URL is not set");
    }
    if (!dataApiUrl) {
      throw new Error("NEON_DATA_API_URL is not set");
    }
    _neon = createClient({
      auth: {
        url: authUrl,
        adapter: SupabaseAuthAdapter,
      },
      dataApi: {
        url: dataApiUrl,
      },
    });
  }
  return _neon;
}

export const neon = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getNeonClient() as Record<string | symbol, unknown>)[prop];
  },
});

export const neonAuth = new Proxy({} as ReturnType<typeof createClient>["auth"], {
  get(_target, prop) {
    return (getNeonClient().auth as Record<string | symbol, unknown>)[prop];
  },
});

export { neon as db };
