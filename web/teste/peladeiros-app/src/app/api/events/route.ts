import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const groupId = Number(body.groupId);
    const startsAt = new Date(body.startsAt);
    const maxPlayers = Number(body.maxPlayers);
    if (!groupId || isNaN(groupId)) return NextResponse.json({ error: "groupId inválido" }, { status: 400 });
    if (!(startsAt instanceof Date) || isNaN(startsAt.getTime())) return NextResponse.json({ error: "startsAt inválido" }, { status: 400 });
    if (!maxPlayers || isNaN(maxPlayers)) return NextResponse.json({ error: "maxPlayers inválido" }, { status: 400 });

    const sql = getDb();
    const result = await sql`
      INSERT INTO events (group_id, starts_at, max_players, status)
      VALUES (${groupId}, ${startsAt.toISOString()}, ${maxPlayers}, 'scheduled')
      RETURNING id, group_id as "groupId", starts_at as "startsAt", max_players as "maxPlayers", status
    ` as Array<any>;
    return NextResponse.json({ event: result[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }
}
