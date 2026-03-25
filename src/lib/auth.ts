import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { type SystemRole } from "@/lib/group-status";

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error(`
AUTH_SECRET nao esta configurado.
A autenticacao nao funcionara sem esta variavel de ambiente.
  `);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET nao esta configurado. A aplicacao nao pode iniciar sem esta variavel de ambiente."
    );
  }

  console.warn("Usando modo de desenvolvimento sem AUTH_SECRET - NAO USE EM PRODUCAO!");
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentialsSchema.parse(credentials);

          const result = await sql`
            SELECT id, name, email, password_hash, system_role
            FROM users
            WHERE email = ${email.toLowerCase()}
          `;

          if (result.length === 0) {
            return null;
          }

          const user = result[0];

          if (!user.password_hash) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password_hash);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
            systemRole: (user.system_role as SystemRole | null) ?? "user",
          };
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(
              "[AUTH] Authentication failed:",
              error instanceof Error ? error.message : "Unknown error"
            );
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.systemRole = user.systemRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        session.user.systemRole = (token.systemRole as SystemRole | undefined) ?? "user";
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
