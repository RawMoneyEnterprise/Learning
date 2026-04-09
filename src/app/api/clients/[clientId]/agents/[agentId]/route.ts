import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PrivateAgentGuard, ForbiddenError, NotFoundError } from "@/lib/private-agent-guard";
import { RosterService } from "@/lib/roster-service";

type Params = { params: Promise<{ clientId: string; agentId: string }> };

/** GET /api/clients/:clientId/agents/:agentId */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, agentId } = await params;

  try {
    await PrivateAgentGuard.check(agentId, clientId);
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    throw err;
  }

  const { data: agent } = await db.from("agents")
    .select("id, name, role, title, description, scope, client_namespace, status, created_at, updated_at")
    .eq("id", agentId)
    .single() as { data: unknown | null };

  return NextResponse.json(agent);
}

/** PATCH /api/clients/:clientId/agents/:agentId */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, agentId } = await params;

  try {
    await PrivateAgentGuard.check(agentId, clientId);
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    throw err;
  }

  const body = await req.json();
  const { name, role, title, description } = body;

  const updatePayload: Record<string, unknown> = {};
  if (name !== undefined) updatePayload.name = name;
  if (role !== undefined) updatePayload.role = role;
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;

  const { data: agent, error } = await db.from("agents")
    .update(updatePayload)
    .eq("id", agentId)
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !agent) {
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }

  RosterService.invalidate(clientId);

  return NextResponse.json(agent);
}

/** DELETE /api/clients/:clientId/agents/:agentId */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, agentId } = await params;

  const { data: agent } = await db.from("agents")
    .select("scope, client_namespace")
    .eq("id", agentId)
    .single() as { data: { scope: string; client_namespace: string | null } | null };

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.scope !== "private" || agent.client_namespace !== `clients/${clientId}`) {
    return NextResponse.json({ error: "Agent not accessible in this client context" }, { status: 403 });
  }

  await db.from("agents").delete().eq("id", agentId);

  RosterService.invalidate(clientId);

  return NextResponse.json({ success: true });
}
