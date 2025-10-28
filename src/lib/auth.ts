import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validar configuração do AUTH_SECRET
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║                     ERRO DE CONFIGURAÇÃO                          ║
╟───────────────────────────────────────────────────────────────────╢
║  AUTH_SECRET não está configurado!                                ║
║                                                                    ║
║  A autenticação não funcionará sem esta variável de ambiente.     ║
║                                                                    ║
║  Para corrigir:                                                    ║
║  1. Gere um secret: openssl rand -base64 32                       ║
║  2. Adicione ao .env.local:                                       ║
║     AUTH_SECRET="valor_gerado"                                    ║
║  3. No Vercel, adicione em: Project Settings > Environment Vars   ║
║                                                                    ║
║  Documentação: /NEON_AUTH_GUIDE.md                                ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
  
  // Em produção, isso é crítico
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET não está configurado. A aplicação não pode iniciar sem esta variável de ambiente."
    );
  }
  
  console.warn("Usando modo de desenvolvimento sem AUTH_SECRET - NÃO USE EM PRODUÇÃO!");
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
        console.log('\n========================================');
        console.log('[AUTH] FUNÇÃO AUTHORIZE CHAMADA!');
        console.log('========================================\n');

        try {
          // Validar credenciais
          const { email, password } = credentialsSchema.parse(credentials);

          console.log('[AUTH DEBUG] Email recebido:', email);
          console.log('[AUTH DEBUG] Senha recebida (tamanho):', password?.length);

          // Buscar usuário no banco
          const result = await sql`
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = ${email.toLowerCase()}
          `;

          console.log('[AUTH DEBUG] Usuário encontrado:', result.length > 0);

          if (result.length === 0) {
            console.log('[AUTH DEBUG] Nenhum usuário encontrado com este email');
            return null;
          }

          const user = result[0];
          console.log('[AUTH DEBUG] User ID:', user.id);
          console.log('[AUTH DEBUG] Tem password_hash?', !!user.password_hash);
          console.log('[AUTH DEBUG] Tamanho do hash:', user.password_hash?.length);

          // Verificar senha
          if (!user.password_hash) {
            console.log('[AUTH DEBUG] password_hash está vazio!');
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash
          );

          console.log('[AUTH DEBUG] Senha válida?', isValidPassword);

          if (!isValidPassword) {
            console.log('[AUTH DEBUG] Senha incorreta!');
            return null;
          }

          // Retornar dados do usuário (sem senha)
          console.log('[AUTH DEBUG] Login bem-sucedido! Retornando usuário');
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
          };
        } catch (error) {
          console.error('\n[AUTH ERROR] ERRO NA AUTENTICAÇÃO:');
          console.error(error);
          console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
          console.error('\n');
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
