/**
 * Neon Client — Auth + Data API
 *
 * Uses @neondatabase/neon-js to create a unified client with:
 * - Neon Auth (session management, sign-in/sign-up/sign-out)
 * - Neon Data API (PostgREST HTTP queries, authenticated via user JWT)
 *
 * Environment variables:
 *   NEON_AUTH_URL      — Neon Auth endpoint (server-side)
 *   NEON_DATA_API_URL  — Neon PostgREST HTTP endpoint (server-side)
 *
 * Usage:
 *   import { neon } from "@/lib/neon";
 *
 *   // Auth
 *   await neon.auth.signIn.email({ email, password, callbackURL: "/dashboard" });
 *   await neon.auth.signOut();
 *
 *   // DB queries (authenticated via user's JWT from Neon Auth)
 *   const { data, error } = await neon.from("issues").select("*").eq("status", "todo");
 */

import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";

// Use process.env for Next.js server-side compatibility (not import.meta.env which is Vite-only)
const authUrl = process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.NEON_DATA_API_URL ?? process.env.VITE_NEON_DATA_URL;

if (!authUrl) {
  throw new Error("NEON_AUTH_URL is not set");
}
if (!dataApiUrl) {
  throw new Error("NEON_DATA_API_URL is not set");
}

export const neon = createClient({
  auth: {
    url: authUrl,
    adapter: SupabaseAuthAdapter,
  },
  dataApi: {
    url: dataApiUrl,
  },
});

/**
 * Re-export the auth object for convenience.
 * Use this to sign in/out and get the current user.
 *
 * Example:
 *   import { neonAuth } from "@/lib/neon";
 *   const { data: session } = await neonAuth.getSession();
 */
export const neonAuth = neon.auth;

/**
 * Re-export the DB query builder for convenience.
 * Queries are automatically scoped to the current user's JWT.
 *
 * Example:
 *   import { db } from "@/lib/neon";
 *   const { data } = await db.from("issues").select("*");
 */
export { neon as db };
