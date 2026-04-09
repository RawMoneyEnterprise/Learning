import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";

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
    .select("id, name, role, title, status, reports_to_id, budget_cents, spent_cents, created_at, updated_at")
    .eq("company_id", companyId)
    .order("name", { ascending: true }) as { data: unknown[] | null };

  return NextResponse.json(agents ?? []);
}
