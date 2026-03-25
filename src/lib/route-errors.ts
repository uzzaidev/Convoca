import { NextResponse } from "next/server";
import { GroupAccessError } from "@/lib/group-access";
import logger from "@/lib/logger";

type HandleRouteErrorOptions = {
  logMessage: string;
  fallbackMessage: string;
  forbiddenMessage?: string;
};

export function handleRouteError(
  error: unknown,
  { logMessage, fallbackMessage, forbiddenMessage }: HandleRouteErrorOptions
) {
  if (error instanceof Error && error.message.includes("autenticado")) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (error instanceof GroupAccessError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (forbiddenMessage && error instanceof Error && error.message === forbiddenMessage) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  logger.error(error, logMessage);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
