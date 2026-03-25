import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { getGroupBlockedMessage } from "@/lib/group-status";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Codigo de convite e obrigatorio" }, { status: 400 });
    }

    const [invite] = await sql`
      SELECT i.*, g.status, g.status_reason
      FROM invites i
      INNER JOIN groups g ON g.id = i.group_id
      WHERE i.code = ${code}
        AND g.deleted_at IS NULL
    `;

    if (!invite) {
      return NextResponse.json({ error: "Codigo de convite invalido" }, { status: 404 });
    }

    if (invite.status !== "active") {
      return NextResponse.json(
        {
          error:
            getGroupBlockedMessage(invite.status, invite.status_reason) ||
            "Este grupo nao esta disponivel no momento.",
        },
        { status: 403 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Este convite ja expirou" }, { status: 400 });
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return NextResponse.json({ error: "Este convite ja atingiu o limite de usos" }, { status: 400 });
    }

    const [existingMember] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${invite.group_id} AND user_id = ${user.id}
    `;

    if (existingMember) {
      return NextResponse.json({ error: "Voce ja e membro deste grupo" }, { status: 400 });
    }

    await sql`
      INSERT INTO group_members (user_id, group_id, role)
      VALUES (${user.id}, ${invite.group_id}, 'member')
    `;

    await sql`
      UPDATE invites
      SET used_count = used_count + 1
      WHERE id = ${invite.id}
    `;

    const [existingWallet] = await sql`
      SELECT * FROM wallets
      WHERE owner_type = 'user' AND owner_id = ${user.id}
    `;

    if (!existingWallet) {
      await sql`
        INSERT INTO wallets (owner_type, owner_id, balance_cents)
        VALUES ('user', ${user.id}, 0)
      `;
    }

    const [group] = await sql`
      SELECT * FROM groups WHERE id = ${invite.group_id}
    `;

    logger.info(
      { groupId: invite.group_id, userId: user.id, inviteId: invite.id },
      "User joined group via invite"
    );

    return NextResponse.json({ message: "Voce entrou no grupo com sucesso", group }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    logger.error(error, "Error joining group");
    return NextResponse.json({ error: "Erro ao entrar no grupo" }, { status: 500 });
  }
}
