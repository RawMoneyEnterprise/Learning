import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  scope: z.enum(["global", "marketplace"]).optional(),
});

/**
 * PATCH  /api/admin/agents/[agentId] — update a global/marketplace agent
 * DELETE /api/admin/agents/[agentId] — remove a global/marketplace agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: agent } = await db.from("agents")
    .select("company_id, scope")
    .eq("id", params.agentId)
    .single() as { data: { company_id: string; scope: string } | null };

  if (!agent || agent.company_id !== companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (agent.scope === "private") {
    return NextResponse.json({ error: "Cannot edit private agents via admin route" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
  if (parsed.data.role !== undefined) updatePayload.role = parsed.data.role;
  if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title;
  if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
  if (parsed.data.scope !== undefined) updatePayload.scope = parsed.data.scope;

  const { data: updated, error } = await db.from("agents")
    .update(updatePayload)
    .eq("id", params.agentId)
    .select("id, name, role, title, description, status, scope, created_at, updated_at")
    .single() as { data: unknown | null; error: unknown };

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { agentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: agent } = await db.from("agents")
    .select("company_id, scope")
    .eq("id", params.agentId)
    .single() as { data: { company_id: string; scope: string } | null };

  if (!agent || agent.company_id !== companyId || agent.scope === "private") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.from("agents").delete().eq("id", params.agentId);

  return new NextResponse(null, { status: 204 });
}
