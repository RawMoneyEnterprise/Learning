import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { RosterService } from "@/lib/roster-service";

type Params = { params: Promise<{ clientId: string }> };

/** GET /api/clients/:clientId/agents — list private agents for a client */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const { data: agents } = await db.from("agents")
    .select("id, name, role, title, description, scope, client_namespace, status, created_at, updated_at")
    .eq("scope", "private")
    .eq("client_namespace", `clients/${clientId}`)
    .order("name", { ascending: true }) as { data: unknown[] | null };

  return NextResponse.json(agents ?? []);
}

/** POST /api/clients/:clientId/agents — register a new private agent */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const body = await req.json();
  const { name, role, title, description } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "name and role are required" }, { status: 400 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: agent, error } = await db.from("agents")
    .insert({
      company_id: companyId,
      name,
      role,
      title: title ?? null,
      description: description ?? null,
      scope: "private",
      client_namespace: `clients/${clientId}`,
    })
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !agent) {
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }

  RosterService.invalidate(clientId);

  return NextResponse.json(agent, { status: 201 });
}
