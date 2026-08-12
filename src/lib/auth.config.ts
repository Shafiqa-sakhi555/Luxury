import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      permissions?: string[];
      isStaff?: boolean;
    };
  }
}

/**
 * Edge-safe slice of the Auth.js config. It must not import Prisma, bcrypt or
 * anything else with Node built-ins, because `middleware.ts` bundles it for the
 * Edge runtime. The Node-only pieces (adapter, credentials provider) live in
 * `src/lib/auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.isStaff = (token.isStaff as boolean) ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
