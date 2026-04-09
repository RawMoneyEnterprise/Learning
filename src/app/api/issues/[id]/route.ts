import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { updateIssueSchema } from "@/lib/validations/issue";

type RouteParams = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: issue } = await db.from("issues")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: Record<string, unknown> | null };

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch related records in parallel
  const [comments, children] = await Promise.all([
    db.from("comments")
      .select("id, body, author_user_id, author_agent_id, created_at, updated_at")
      .eq("issue_id", params.id)
      .order("created_at", { ascending: true }) as Promise<{ data: unknown[] | null }>,

    db.from("issues")
      .select("id, identifier, title, status, priority")
      .eq("parent_id", params.id)
      .order("created_at", { ascending: true }) as Promise<{ data: unknown[] | null }>,
  ]);

  return NextResponse.json({
    ...issue,
    comments: comments.data ?? [],
    children: children.data ?? [],
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: existing } = await db.from("issues")
    .select("id")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: { id: string } | null };

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { comment, title, description, status, priority, projectId, goalId, assigneeAgentId, assigneeUserId } = parsed.data;

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  if (status !== undefined) updatePayload.status = status;
  if (priority !== undefined) updatePayload.priority = priority;
  if (projectId !== undefined) updatePayload.project_id = projectId;
  if (goalId !== undefined) updatePayload.goal_id = goalId;
  if (assigneeAgentId !== undefined) updatePayload.assignee_agent_id = assigneeAgentId;
  if (assigneeUserId !== undefined) updatePayload.assignee_user_id = assigneeUserId;

  const { data: issue, error } = await db.from("issues")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !issue) {
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }

  // Create inline comment if provided (sequential — no transaction support over HTTP)
  if (comment?.trim()) {
    await db.from("comments").insert({
      issue_id: params.id,
      author_user_id: session.user.id,
      body: comment.trim(),
    });
  }

  return NextResponse.json(issue);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: existing } = await db.from("issues")
    .select("id")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: { id: string } | null };

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete: mark as cancelled
  await db.from("issues").update({ status: "cancelled" }).eq("id", params.id);

  return new NextResponse(null, { status: 204 });
}
