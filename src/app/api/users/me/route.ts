import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres").max(255),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const [profile] = await sql`
      SELECT id, name, email, image, system_role, created_at, updated_at
      FROM users
      WHERE id = ${user.id}
    `;

    if (!profile) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error fetching user profile");
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    const [updated] = await sql`
      UPDATE users
      SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING id, name, email, image, system_role, updated_at
    `;

    logger.info({ userId: user.id }, "User profile updated");

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error updating user profile");
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
