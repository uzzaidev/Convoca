import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não está definida. " +
    "Configure a integração Vercel-Supabase ou adicione manualmente no .env.local"
  );
}

export const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
