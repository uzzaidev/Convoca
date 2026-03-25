import { auth } from "./auth";
import { sql } from "@/db/client";
import { type SystemRole } from "@/lib/group-status";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  systemRole: SystemRole;
};

/**
 * Helper para obter o usuario autenticado nas rotas da API
 * Retorna o usuario com informacoes do banco de dados
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  try {
    const dbUser = await sql`
      SELECT id, name, email, image, system_role, created_at, updated_at
      FROM users
      WHERE id = ${session.user.id}
    `;

    if (dbUser.length > 0) {
      return {
        id: dbUser[0].id,
        email: dbUser[0].email,
        name: dbUser[0].name,
        image: dbUser[0].image,
        systemRole: (dbUser[0].system_role as SystemRole | null) ?? "user",
      };
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar usuario no banco:", error);
    return null;
  }
}

/**
 * Helper para verificar se ha um usuario autenticado
 * Lanca erro 401 se nao houver usuario autenticado
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("NÃ£o autenticado");
  }

  return user;
}

export async function requireSystemAdmin() {
  const user = await requireAuth();

  if (user.systemRole !== "system_admin") {
    throw new Error("Sem permissao de administrador do sistema");
  }

  return user;
}
