import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import logger from "@/lib/logger";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";

const signupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 signup attempts per minute per IP
    const rateLimit = await checkRateLimit(request, RateLimitPresets.AUTH);

    if (rateLimit.limited) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${retryAfter} segundos.` },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();

    // Validar dados
    const validatedData = signupSchema.parse(body);
    const { name, email, password } = validatedData;

    // Verificar se o email já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${passwordHash}
      )
      RETURNING id, name, email
    `;

    logger.info({ userId: newUser[0].id }, "Novo usuário criado");

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error({ error }, "Erro ao criar usuário");
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}
