import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const id = Number(eventId);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const sql = getDb();
  const res = await sql`
    SELECT id, group_id as "groupId", starts_at as "startsAt", max_players as "maxPlayers", status
    FROM events
    WHERE id = ${id}
  ` as Array<any>;
  if (res.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: res[0] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const id = Number(eventId);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const patch = await req.json();
  const sql = getDb();
  if (patch.startsAt) {
    await sql`UPDATE events SET starts_at = ${new Date(patch.startsAt).toISOString()} WHERE id = ${id}`;
  }
  if (patch.maxPlayers) {
    await sql`UPDATE events SET max_players = ${Number(patch.maxPlayers)} WHERE id = ${id}`;
  }
  if (patch.status) {
    await sql`UPDATE events SET status = ${String(patch.status)} WHERE id = ${id}`;
  }
  const updated = await sql`
    SELECT id, group_id as "groupId", starts_at as "startsAt", max_players as "maxPlayers", status
    FROM events WHERE id = ${id}
  ` as Array<any>;
  if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: updated[0] });
}
