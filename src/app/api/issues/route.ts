import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { createIssueSchema } from "@/lib/validations/issue";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");
  const projectId = searchParams.get("projectId");
  const assigneeAgentId = searchParams.get("assigneeAgentId");
  const q = searchParams.get("q");

  let query = db.from("issues")
    .select("id, identifier, title, status, priority, assignee_agent_id, assignee_user_id, project_id, created_at, updated_at")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  // Support comma-separated status values
  const statusList = statusParam ? statusParam.split(",").map((s) => s.trim()) : null;
  if (statusList?.length === 1) {
    query = query.eq("status", statusList[0]);
  } else if (statusList && statusList.length > 1) {
    query = query.in("status", statusList);
  }

  const priorityList = priorityParam ? priorityParam.split(",").map((p) => p.trim()) : null;
  if (priorityList?.length === 1) {
    query = query.eq("priority", priorityList[0]);
  } else if (priorityList && priorityList.length > 1) {
    query = query.in("priority", priorityList);
  }

  if (projectId) query = query.eq("project_id", projectId);
  if (assigneeAgentId) query = query.eq("assignee_agent_id", assigneeAgentId);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: issues } = await query as { data: unknown[] | null };

  return NextResponse.json(issues ?? []);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  // Get next issue number and company slug in parallel
  const [lastIssueResult, companyResult] = await Promise.all([
    db.from("issues")
      .select("issue_number")
      .eq("company_id", companyId)
      .order("issue_number", { ascending: false })
      .limit(1)
      .single() as Promise<{ data: { issue_number: number } | null }>,

    db.from("companies")
      .select("slug")
      .eq("id", companyId)
      .single() as Promise<{ data: { slug: string } | null }>,
  ]);

  if (!companyResult.data) {
    return NextResponse.json({ error: "Company not found" }, { status: 400 });
  }

  const issueNumber = (lastIssueResult.data?.issue_number ?? 0) + 1;
  const identifier = `${companyResult.data.slug}-${issueNumber}`;

  const { title, description, status, priority, projectId, goalId, parentId, assigneeAgentId, assigneeUserId } = parsed.data;

  const { data: issue, error } = await db.from("issues")
    .insert({
      title,
      description: description ?? null,
      status: status ?? "backlog",
      priority: priority ?? "medium",
      project_id: projectId ?? null,
      goal_id: goalId ?? null,
      parent_id: parentId ?? null,
      assignee_agent_id: assigneeAgentId ?? null,
      assignee_user_id: assigneeUserId ?? null,
      company_id: companyId,
      created_by_user_id: session.user.id,
      issue_number: issueNumber,
      identifier,
    })
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !issue) {
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }

  return NextResponse.json(issue, { status: 201 });
}
