import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RosterService } from "@/lib/roster-service";

type Params = { params: Promise<{ clientId: string; agentId: string }> };

/** DELETE /api/clients/:clientId/activations/:agentId — deactivate a marketplace agent */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, agentId } = await params;

  const { data: activation } = await db.from("client_agent_activations")
    .select("id")
    .eq("client_id", clientId)
    .eq("agent_id", agentId)
    .single() as { data: { id: string } | null };

  if (!activation) {
    return NextResponse.json({ error: "Activation not found" }, { status: 404 });
  }

  await db.from("client_agent_activations")
    .delete()
    .eq("client_id", clientId)
    .eq("agent_id", agentId);

  RosterService.invalidate(clientId);

  return NextResponse.json({ success: true });
}
