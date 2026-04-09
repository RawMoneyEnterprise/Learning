import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

// Derive a short uppercase slug (3–5 chars) from name or email for the company prefix
function generateSlug(input: string): string {
  const clean = input
    .replace(/@.*$/, "") // strip email domain
    .replace(/[^a-zA-Z]/g, "") // letters only
    .toUpperCase();
  return clean.slice(0, 4) || "USR";
}

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email is already registered
    const { data: existing } = await db.from("users")
      .select("id")
      .eq("email", email)
      .single() as { data: { id: string } | null };

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Ensure company slug is unique
    const slug = generateSlug(name || email);
    const { data: existingCompany } = await db.from("companies")
      .select("id")
      .eq("slug", slug)
      .single() as { data: { id: string } | null };
    const finalSlug = existingCompany
      ? `${slug}${Math.floor(Math.random() * 900) + 100}`
      : slug;

    // Create company then user sequentially (no transaction support over HTTP)
    const { data: company, error: companyError } = await db.from("companies")
      .insert({ name: name || email, slug: finalSlug })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };

    if (companyError || !company) {
      return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }

    const { data: user, error: userError } = await db.from("users")
      .insert({ name, email, password_hash: passwordHash, company_id: company.id })
      .select("id, email, name, company_id")
      .single() as { data: { id: string; email: string; name: string; company_id: string } | null; error: unknown };

    if (userError || !user) {
      // Best-effort cleanup of orphaned company
      await db.from("companies").delete().eq("id", company.id);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
