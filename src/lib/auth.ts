import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/db/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Placeholder credentials provider to prevent auth initialization errors
    // TODO: Replace with Email Magic Link provider
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize() {
        // This is a placeholder and should not be used in production
        // Will be replaced with proper Email Magic Link authentication
        return null;
      },
    }),
    // OAuth providers opcionais (Google, etc) podem ser adicionados aqui
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Criar ou atualizar usuário no banco
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${user.email}
      `;

      if (existingUser.length === 0) {
        await sql`
          INSERT INTO users (name, email, image, email_verified)
          VALUES (
            ${user.name || "Jogador"},
            ${user.email},
            ${user.image || null},
            ${new Date().toISOString()}
          )
        `;
      } else {
        await sql`
          UPDATE users
          SET
            name = ${user.name || "Jogador"},
            image = ${user.image || null},
            email_verified = ${new Date().toISOString()},
            updated_at = ${new Date().toISOString()}
          WHERE email = ${user.email}
        `;
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Buscar ID do usuário no banco
        const dbUser = await sql`
          SELECT id, name, email, image
          FROM users
          WHERE email = ${session.user.email}
        `;

        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
