import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import {
  generateUpcomingEventsForRecurrence,
  type EventRecurrenceRecord,
} from "@/lib/recurrences";
import logger from "@/lib/logger";

async function handleRecurringEventsCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const recurrences = await sql`
      SELECT * FROM event_recurrences WHERE is_active = true
    `;

    if (recurrences.length === 0) {
      return NextResponse.json({ message: "Nenhuma recorrencia ativa", generated: 0 });
    }

    let generated = 0;
    const now = new Date();

    for (const recurrence of recurrences) {
      generated += await generateUpcomingEventsForRecurrence(
        recurrence as EventRecurrenceRecord,
        {
          fromDate: now,
          daysAhead: 14,
        }
      );
    }

    logger.info({ generated, recurrences: recurrences.length }, "Recurring events generation complete");

    return NextResponse.json({
      message: "Eventos recorrentes gerados",
      generated,
      recurrences: recurrences.length,
    });
  } catch (error) {
    logger.error(error, "Error generating recurring events");
    return NextResponse.json(
      { error: "Erro ao gerar eventos recorrentes" },
      { status: 500 }
    );
  }
}

// Vercel Cron calls this path with GET.
export async function GET(request: NextRequest) {
  return handleRecurringEventsCron(request);
}

export async function POST(request: NextRequest) {
  return handleRecurringEventsCron(request);
}
