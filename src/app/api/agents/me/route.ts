import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Returns the current user's identity in an agent-compatible format.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await db.from("users")
    .select("id, name, email, image, company_id")
    .eq("id", session.user.id)
    .single() as { data: { id: string; name: string | null; email: string; image: string | null; company_id: string | null } | null };

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let company: { id: string; name: string; slug: string } | null = null;
  if (user.company_id) {
    const { data } = await db.from("companies")
      .select("id, name, slug")
      .eq("id", user.company_id)
      .single() as { data: { id: string; name: string; slug: string } | null };
    company = data;
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    companyId: user.company_id,
    company,
    kind: "user",
  });
}
