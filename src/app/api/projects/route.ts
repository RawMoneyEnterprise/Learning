import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).optional().default("active"),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: projects } = await db.from("projects")
    .select("id, name, description, status, target_date, created_at, updated_at")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false }) as { data: unknown[] | null };

  return NextResponse.json(projects ?? []);
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
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, status, targetDate } = parsed.data;

  const { data: project, error } = await db.from("projects")
    .insert({
      name,
      description: description ?? null,
      status: status ?? "active",
      target_date: targetDate ?? null,
      company_id: companyId,
    })
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !project) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json(project, { status: 201 });
}
