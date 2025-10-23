import { stackServerApp } from "./stack";
import { sql } from "@/db/client";

/**
 * Helper para obter o usuário autenticado nas rotas da API
 * Retorna o usuário com informações do banco de dados
 */
export async function getCurrentUser() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    return null;
  }

  // Buscar informações adicionais do usuário no banco
  try {
    const dbUser = await sql`
      SELECT id, name, email, image, created_at, updated_at
      FROM users
      WHERE email = ${user.primaryEmail || ""}
    `;

    if (dbUser.length > 0) {
      return {
        id: dbUser[0].id,
        email: dbUser[0].email,
        name: dbUser[0].name,
        image: dbUser[0].image,
        stackUserId: user.id,
      };
    }

    // Se o usuário não existe no banco, criar
    const newUser = await sql`
      INSERT INTO users (name, email, image, email_verified)
      VALUES (
        ${user.displayName || user.primaryEmail?.split("@")[0] || "Jogador"},
        ${user.primaryEmail || ""},
        ${user.profileImageUrl || null},
        ${new Date().toISOString()}
      )
      RETURNING id, name, email, image
    `;

    return {
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
      image: newUser[0].image,
      stackUserId: user.id,
    };
  } catch (error) {
    console.error("Erro ao buscar/criar usuário no banco:", error);
    // Retornar informações básicas do Stack Auth
    return {
      id: user.id,
      email: user.primaryEmail || "",
      name: user.displayName || "Jogador",
      image: user.profileImageUrl || null,
      stackUserId: user.id,
    };
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
