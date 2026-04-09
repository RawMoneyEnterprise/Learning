/**
 * Shared DB helpers used across API routes.
 *
 * AgentScope is defined here (not imported from @prisma/client) since
 * Prisma is no longer used at runtime — the Neon HTTP Data API is used instead.
 */

import { db } from "@/lib/db";

export type AgentScope = "global" | "marketplace" | "private";

/**
 * Returns the companyId for a given userId, or null if not found / not in a company.
 */
export async function getUserCompanyId(userId: string): Promise<string | null> {
  const { data } = await db.from("users").select("company_id").eq("id", userId).single();
  return (data as { company_id: string } | null)?.company_id ?? null;
}
