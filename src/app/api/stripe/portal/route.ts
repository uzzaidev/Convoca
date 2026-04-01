import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/subscription";
import logger from "@/lib/logger";

/**
 * POST /api/stripe/portal
 * Cria uma sessão do Stripe Customer Portal para o usuário gerenciar assinaturas
 */
export async function POST() {
  try {
    const user = await requireAuth();

    const customerId = await getOrCreateStripeCustomer(user.id);
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autenticado")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    logger.error(error, "Error creating portal session");
    return NextResponse.json(
      { error: "Erro ao abrir portal de pagamento" },
      { status: 500 }
    );
  }
}
