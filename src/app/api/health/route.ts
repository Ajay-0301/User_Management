import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const check = await testConnection();
  if (check.ok) {
    return NextResponse.json({
      status: "connected",
      message: "PostgreSQL database is connected and healthy",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    {
      status: "disconnected",
      message: check.message || "Database connection unavailable",
      timestamp: new Date().toISOString(),
    },
    { status: 503 }
  );
}

