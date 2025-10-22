import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const data = await sql`SELECT id, name, description, privacy, created_at as "createdAt" FROM groups ORDER BY created_at DESC LIMIT 50` as Array<any>;
  return NextResponse.json({ groups: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Field 'name' is required" }, { status: 400 });
    }
    const description = typeof body.description === "string" ? body.description : null;
    const sql = getDb();
    const result = await sql`
      INSERT INTO groups (name, description, privacy)
      VALUES (${body.name}, ${description}, 'private')
      RETURNING id, name, description, privacy, created_at as "createdAt"
    ` as Array<any>;
    return NextResponse.json({ group: result[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }
}
