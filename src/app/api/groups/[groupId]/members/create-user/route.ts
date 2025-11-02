import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";

type Params = Promise<{ groupId: string }>;

// POST /api/groups/:groupId/members/create-user - Create user and add to group (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Check if current user is admin
    const [membership] = await sql`
      SELECT role FROM group_members
      WHERE group_id = ${groupId} AND user_id = ${user.id}
    `;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas admins podem criar usuários" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, defaultPassword } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email" },
        { status: 400 }
      );
    }

    // Use provided password or default
    const password = defaultPassword || "Peladeiros2024!";

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name
    `;

    // Create wallet for user
    await sql`
      INSERT INTO wallets (owner_type, owner_id, balance_cents)
      VALUES ('user', ${newUser.id}, 0)
    `;

    // Add user to group with default role 'member' and base_rating 5 (scale 0-10)
    const [newMember] = await sql`
      INSERT INTO group_members (group_id, user_id, role, base_rating)
      VALUES (${groupId}, ${newUser.id}, 'member', 5)
      RETURNING *
    `;

    logger.info(
      { groupId, userId: newUser.id, createdBy: user.id, email },
      "User created and added to group by admin"
    );

    // Return member with user info and temporary password
    return NextResponse.json({
      message: "Usuário criado e adicionado ao grupo com sucesso",
      member: {
        ...newMember,
        name: newUser.name,
        email: newUser.email,
      },
      temporaryPassword: password,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error creating user and adding to group");
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
