import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Ensure company slug is unique
    const baseSlug = generateSlug(name || email);
    const existingCompany = await prisma.company.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const finalSlug = existingCompany
      ? `${baseSlug}${Math.floor(Math.random() * 900) + 100}`
      : baseSlug;

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: name || email, slug: finalSlug },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          companyId: company.id,
        },
        select: { id: true, email: true, name: true, companyId: true },
      });

      return user;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[register] error:", message);
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}
