import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

/**
 * DELETE /api/customer-agents/private/[agentId]
 * Remove a private agent owned by the current client.
 */
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
    .select("scope, client_namespace")
    .eq("id", params.agentId)
    .single() as { data: { scope: string; client_namespace: string | null } | null };

  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (agent.scope !== "private" || agent.client_namespace !== `clients/${companyId}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.from("agents").delete().eq("id", params.agentId);

  return new NextResponse(null, { status: 204 });
}
