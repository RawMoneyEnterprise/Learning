import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

type RouteParams = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: project } = await db.from("projects")
    .select("id, name, description, status, target_date, created_at, updated_at")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: Record<string, unknown> | null };

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: issues } = await db.from("issues")
    .select("id, identifier, title, status, priority, assignee_agent_id, assignee_user_id, updated_at")
    .eq("project_id", params.id)
    .order("updated_at", { ascending: false }) as { data: unknown[] | null };

  return NextResponse.json({ ...project, issues: issues ?? [] });
}
