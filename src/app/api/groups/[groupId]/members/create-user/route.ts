import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

// POST /api/groups/:groupId/members/create-user - Create user and add to group (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar usuÃ¡rios",
    });

    const body = await request.json();
    const { email, name, defaultPassword } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email e nome sÃ£o obrigatÃ³rios" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invÃ¡lido" },
        { status: 400 }
      );
    }

    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser) {
      return NextResponse.json(
        { error: "JÃ¡ existe um usuÃ¡rio com este email" },
        { status: 400 }
      );
    }

    const password = defaultPassword || randomBytes(10).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name
    `;

    await sql`
      INSERT INTO wallets (owner_type, owner_id, balance_cents)
      VALUES ('user', ${newUser.id}, 0)
    `;

    const [newMember] = await sql`
      INSERT INTO group_members (group_id, user_id, role, base_rating)
      VALUES (${groupId}, ${newUser.id}, 'member', 5)
      RETURNING *
    `;

    logger.info(
      { groupId, userId: newUser.id, createdBy: user.id, email },
      "User created and added to group by admin"
    );

    return NextResponse.json({
      message: "UsuÃ¡rio criado e adicionado ao grupo com sucesso",
      member: {
        ...newMember,
        name: newUser.name,
        email: newUser.email,
      },
      temporaryPassword: password,
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error creating user and adding to group",
      fallbackMessage: "Erro ao criar usuÃ¡rio",
    });
  }
}
