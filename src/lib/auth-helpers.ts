import { auth } from "./auth";
import { sql } from "@/db/client";

/**
 * Helper para obter o usuário autenticado nas rotas da API
 * Retorna o usuário com informações do banco de dados
 */
export async function getCurrentUser() {
  const session = await auth();
  
  if (!session || !session.user) {
    return null;
  }

  // Buscar informações adicionais do usuário no banco
  try {
    const dbUser = await sql`
      SELECT id, name, email, image, created_at, updated_at
      FROM users
      WHERE id = ${session.user.id}
    `;

    if (dbUser.length > 0) {
      return {
        id: dbUser[0].id,
        email: dbUser[0].email,
        name: dbUser[0].name,
        image: dbUser[0].image,
      };
    }

    // Se o usuário não existe no banco (não deveria acontecer), retornar null
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário no banco:", error);
    return null;
  }
}

/**
 * Helper para verificar se há um usuário autenticado
 * Lança erro 401 se não houver usuário autenticado
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Não autenticado");
  }
  
  return user;
}
