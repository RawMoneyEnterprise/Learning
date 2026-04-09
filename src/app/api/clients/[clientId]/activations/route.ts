import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RosterService } from "@/lib/roster-service";

type Params = { params: Promise<{ clientId: string }> };

/** GET /api/clients/:clientId/activations — list activated marketplace agents */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const { data: activations } = await db.from("client_agent_activations")
    .select("id, client_id, agent_id, activated_at")
    .eq("client_id", clientId)
    .order("activated_at", { ascending: false }) as { data: unknown[] | null };

  return NextResponse.json(activations ?? []);
}

/** POST /api/clients/:clientId/activations — activate a marketplace agent */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const { agentId } = await req.json();

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  const { data: agent } = await db.from("agents")
    .select("scope")
    .eq("id", agentId)
    .single() as { data: { scope: string } | null };

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.scope !== "marketplace") {
    return NextResponse.json({ error: "Only marketplace agents can be activated" }, { status: 400 });
  }

  // Upsert: ignore conflict on unique (client_id, agent_id)
  const { data: activation, error } = await db.from("client_agent_activations")
    .upsert({ client_id: clientId, agent_id: agentId }, { onConflict: "client_id,agent_id" })
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !activation) {
    return NextResponse.json({ error: "Failed to activate agent" }, { status: 500 });
  }

  RosterService.invalidate(clientId);

  return NextResponse.json(activation, { status: 201 });
}
