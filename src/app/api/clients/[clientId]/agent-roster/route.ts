import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RosterService } from "@/lib/roster-service";

type Params = { params: Promise<{ clientId: string }> };

/**
 * GET /api/clients/:clientId/agent-roster
 *
 * Returns the scoped agent roster for a client:
 *   - all global agents
 *   - marketplace agents activated by this client
 *   - private agents registered under this client namespace
 *
 * Response is cached per clientId for 30 seconds.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const agents = await RosterService.getScopedRoster(clientId);

  return NextResponse.json({ clientId, agents });
}
