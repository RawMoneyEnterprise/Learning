import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { RosterService } from "@/lib/roster-service";

/**
 * POST   /api/customer-agents/marketplace/[agentId]/activate — activate
 * DELETE /api/customer-agents/marketplace/[agentId]/activate — deactivate
 */
export async function POST(_req: Request, { params }: { params: { agentId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: agent } = await db.from("agents")
    .select("id, scope")
    .eq("id", params.agentId)
    .single() as { data: { id: string; scope: string } | null };

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.scope !== "marketplace") {
    return NextResponse.json({ error: "Only marketplace agents can be activated" }, { status: 400 });
  }

  const { data: activation, error } = await db.from("client_agent_activations")
    .upsert(
      { client_id: companyId, agent_id: params.agentId },
      { onConflict: "client_id,agent_id" }
    )
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !activation) {
    return NextResponse.json({ error: "Failed to activate agent" }, { status: 500 });
  }

  RosterService.invalidate(companyId);
  return NextResponse.json(activation, { status: 201 });
}

export async function DELETE(_req: Request, { params }: { params: { agentId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  await db.from("client_agent_activations")
    .delete()
    .eq("client_id", companyId)
    .eq("agent_id", params.agentId);

  RosterService.invalidate(companyId);
  return new NextResponse(null, { status: 204 });
}
