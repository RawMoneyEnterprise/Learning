import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required on Vercel (behind proxy/load balancer) to trust x-forwarded-host
  trustHost: true,
  // No adapter — JWT sessions only. User creation/lookup handled in callbacks.
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, image: true, passwordHash: true },
        });

        if (!user?.passwordHash) return null;

        // Dynamic import keeps bcryptjs out of the edge runtime
        const { compare } = await import("bcryptjs");
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.type === "credentials") {
          // user.id is already the DB row id from authorize()
          token.id = user.id;
        } else if (account.type === "oauth" && token.email) {
          // Look up existing user by email; create one if this is first OAuth sign-in
          const existing = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true },
          });

          if (existing) {
            token.id = existing.id;
          } else {
            const created = await prisma.user.create({
              data: {
                email: token.email,
                name: token.name ?? null,
                image: (token as Record<string, unknown>).picture as string ?? null,
              },
              select: { id: true },
            });
            token.id = created.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
