import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbUrlPrefix = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.substring(0, 20) + "..." 
    : "NOT SET";

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL_CONFIGURED: hasDbUrl,
    DATABASE_URL_PREFIX: dbUrlPrefix,
  };

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: envVars,
  });
}
