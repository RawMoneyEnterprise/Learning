import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

/**
 * GET /api/customer-agents/marketplace
 * Returns all marketplace agents with activation status for the current client.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = await getUserCompanyId(session.user.id);
  if (!clientId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  // Fetch all marketplace agents
  const { data: agents } = await db.from("agents")
    .select("id, name, role, title, description, status, scope")
    .eq("scope", "marketplace")
    .order("name", { ascending: true }) as { data: { id: string; name: string; role: string; title: string | null; description: string | null; status: string; scope: string }[] | null };

  if (!agents || agents.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch activations for this client
  const { data: activations } = await db.from("client_agent_activations")
    .select("agent_id, activated_at")
    .eq("client_id", clientId)
    .in("agent_id", agents.map((a) => a.id)) as { data: { agent_id: string; activated_at: string }[] | null };

  const activationMap = new Map((activations ?? []).map((a) => [a.agent_id, a.activated_at]));

  return NextResponse.json(
    agents.map((a) => ({
      ...a,
      activated: activationMap.has(a.id),
      activatedAt: activationMap.get(a.id) ?? null,
    }))
  );
}
