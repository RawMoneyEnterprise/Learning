import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { z } from "zod";

const createGlobalAgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  scope: z.enum(["global", "marketplace"]).default("global"),
});

/**
 * GET  /api/admin/agents — list all global + marketplace agents
 * POST /api/admin/agents — create a new global or marketplace agent (admin only)
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

  const { data: agents } = await db.from("agents")
    .select("id, name, role, title, description, status, scope, created_at, updated_at")
    .eq("company_id", companyId)
    .in("scope", ["global", "marketplace"])
    .order("scope", { ascending: true })
    .order("name", { ascending: true }) as { data: unknown[] | null };

  return NextResponse.json(agents ?? []);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createGlobalAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: agent, error } = await db.from("agents")
    .insert({
      name: parsed.data.name,
      role: parsed.data.role,
      title: parsed.data.title ?? null,
      description: parsed.data.description ?? null,
      scope: parsed.data.scope,
      company_id: companyId,
    })
    .select("id, name, role, title, description, status, scope, created_at, updated_at")
    .single() as { data: unknown | null; error: unknown };

  if (error || !agent) {
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }

  return NextResponse.json(agent, { status: 201 });
}
