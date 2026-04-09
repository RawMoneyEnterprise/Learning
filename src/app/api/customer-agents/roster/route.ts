import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserCompanyId } from "@/lib/db-helpers";
import { RosterService } from "@/lib/roster-service";

/**
 * GET /api/customer-agents/roster
 * Returns the scoped agent roster for the current user's company (client).
 * Uses RosterService (with 30s cache) to mirror the CEO agent context.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const agents = await RosterService.getScopedRoster(companyId);

  return NextResponse.json({ clientId: companyId, agents });
}
