import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const { data: user } = await db
          .from("users")
          .select("id, email, name, image, password_hash")
          .eq("email", parsed.data.email)
          .single() as { data: { id: string; email: string; name: string | null; image: string | null; password_hash: string | null } | null };

        if (!user?.password_hash) return null;

        // Dynamic import keeps bcryptjs out of the edge runtime
        const { compare } = await import("bcryptjs");
        const valid = await compare(parsed.data.password, user.password_hash);
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
          const { data: existing } = await db
            .from("users")
            .select("id")
            .eq("email", token.email)
            .single() as { data: { id: string } | null };

          if (existing) {
            token.id = existing.id;
          } else {
            const { data: created } = await db
              .from("users")
              .insert({ email: token.email, name: token.name ?? null, image: (token as Record<string, unknown>).picture ?? null })
              .select("id")
              .single() as { data: { id: string } | null };
            if (created) token.id = created.id;
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
