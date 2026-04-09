import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

// Compact issue list for the current user — mirrors paperclip.ing's inbox-lite pattern.
// Returns only fields needed for prioritization (no descriptions, no comments).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const { data: issues } = await db.from("issues")
    .select("id, identifier, title, status, priority, project_id, goal_id, parent_id, updated_at")
    .eq("company_id", companyId)
    .eq("assignee_user_id", session.user.id)
    .not("status", "in", '("done","cancelled")')
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false }) as { data: unknown[] | null };

  return NextResponse.json(issues ?? []);
}
