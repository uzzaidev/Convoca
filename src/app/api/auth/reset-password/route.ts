import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { z } from "zod";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find user with valid reset token
    const [user] = await sql`
      SELECT id, email, name, reset_token, reset_token_expiry
      FROM users
      WHERE reset_token = ${token}
    `;

    if (!user) {
      logger.warn({ token }, "Invalid reset token attempted");
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const tokenExpiry = new Date(user.reset_token_expiry);
    const now = new Date();

    if (!user.reset_token_expiry || tokenExpiry < now) {
      logger.warn({ userId: user.id, email: user.email }, "Expired reset token attempted");
      
      // Clear expired token
      await sql`
        UPDATE users
        SET reset_token = NULL, reset_token_expiry = NULL
        WHERE id = ${user.id}
      `;

      return NextResponse.json(
        { error: "Token expirado. Solicite um novo link de redefinição." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await sql`
      UPDATE users
      SET 
        password_hash = ${passwordHash},
        reset_token = NULL,
        reset_token_expiry = NULL,
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    logger.info(
      { userId: user.id, email: user.email },
      "Password reset successful"
    );

    return NextResponse.json({ 
      message: "Senha redefinida com sucesso! Você já pode fazer login com sua nova senha." 
    });
  } catch (error) {
    logger.error(error, "Error resetting password");
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
