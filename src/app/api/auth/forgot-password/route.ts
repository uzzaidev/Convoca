import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import { z } from "zod";
import logger from "@/lib/logger";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists
    const [user] = await sql`
      SELECT id, email, name FROM users WHERE email = ${email.toLowerCase()}
    `;

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info({ email }, "Password reset requested for non-existent email");
      return NextResponse.json({ 
        message: "Se o email existir em nossa base, você receberá um link para redefinir sua senha." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await sql`
      UPDATE users
      SET 
        reset_token = ${resetToken},
        reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE id = ${user.id}
    `;

    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    logger.info({ userId: user.id, email: user.email }, "Solicitação de redefinição de senha gerada");

    // Envia e-mail com o link de redefinição
    await sendPasswordResetEmail(user.email, resetLink, user.name);

    // Em desenvolvimento, loga o link caso RESEND_API_KEY não esteja configurada
    if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
      console.log("\n===========================================");
      console.log("🔐 LINK DE REDEFINIÇÃO DE SENHA (DEV MODE)");
      console.log("===========================================");
      console.log(`Email: ${user.email}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Link: ${resetLink}`);
      console.log("===========================================\n");
    }

    return NextResponse.json({
      message: "Se o email existir em nossa base, você receberá um link para redefinir sua senha.",
    });
  } catch (error) {
    logger.error(error, "Error processing forgot password request");
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
