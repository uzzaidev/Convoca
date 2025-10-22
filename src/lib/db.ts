import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Configure it in your .env file.");
  }
  _sql = neon(url);
  return _sql;
}

export type { NeonQueryFunction } from "@neondatabase/serverless";
