import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserQuotaStatus } from "@/lib/agent/quota";
import { handleRouteError } from "@/lib/route-errors";

export async function GET() {
  try {
    const user = await requireAuth();
    const quota = await getUserQuotaStatus(user.id);
    return NextResponse.json({ quota });
  } catch (err) {
    return handleRouteError(err, {
      logMessage: "agent/quota GET: erro",
      fallbackMessage: "Erro ao buscar quota",
    });
  }
}
