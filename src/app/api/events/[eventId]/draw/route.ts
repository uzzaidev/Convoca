import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return NextResponse.json({ error: "Sorteio de times ainda não implementado sem Drizzle. Podemos reimplementar com SQL se desejar." }, { status: 501 });
}
