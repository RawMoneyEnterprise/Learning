import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { z } from "zod";

type RouteParams = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: issue } = await db.from("issues")
    .select("id")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: { id: string } | null };

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");
  const ascending = (searchParams.get("order") ?? "asc") === "asc";

  let query = db.from("comments")
    .select("id, body, author_user_id, author_agent_id, created_at, updated_at")
    .eq("issue_id", params.id)
    .order("created_at", { ascending });

  // Cursor-based pagination: fetch comments after a given comment id
  if (after) {
    const { data: cursor } = await db.from("comments")
      .select("created_at")
      .eq("id", after)
      .single() as { data: { created_at: string } | null };

    if (cursor) {
      query = ascending
        ? query.gt("created_at", cursor.created_at)
        : query.lt("created_at", cursor.created_at);
    }
  }

  const { data: comments } = await query as { data: unknown[] | null };

  return NextResponse.json(comments ?? []);
}

const createCommentSchema = z.object({
  body: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: issue } = await db.from("issues")
    .select("id")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: { id: string } | null };

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: comment, error } = await db.from("comments")
    .insert({
      issue_id: params.id,
      author_user_id: session.user.id,
      body: parsed.data.body,
    })
    .select()
    .single() as { data: unknown | null; error: unknown };

  if (error || !comment) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
