import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const id = Number(eventId);
    if (!id) return NextResponse.json({ error: "invalid event id" }, { status: 400 });
    const body = await req.json();
    const status = body?.status as "yes" | "no" | "waitlist";
    const role = body?.role as "gk" | "line";
    const userId = Number(body?.userId);
    if (!userId || isNaN(userId)) throw new Error("userId required");
    if (!status || !["yes", "no", "waitlist"].includes(status)) throw new Error("invalid status");
    if (!role || !["gk", "line"].includes(role)) throw new Error("invalid role");
    const sql = getDb();
    const updated = await sql`
      UPDATE event_attendance SET status = ${status}, role = ${role}
      WHERE event_id = ${id} AND user_id = ${userId}
      RETURNING user_id
    ` as Array<any>;
    if (updated.length === 0) {
      await sql`
        INSERT INTO event_attendance (event_id, user_id, status, role)
        VALUES (${id}, ${userId}, ${status}, ${role})
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }
}
