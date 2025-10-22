import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Ações do jogo ainda não implementadas sem Drizzle" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "Ações do jogo ainda não implementadas sem Drizzle" }, { status: 501 });
}
