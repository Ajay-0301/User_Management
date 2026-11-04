import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const check = await testConnection();
  
  // Return HTTP 200 so container load balancers (like Nimbuz / Nginx) recognize the container as alive
  return NextResponse.json(
    {
      status: check.ok ? "connected" : "error",
      database: check.ok ? "connected" : "disconnected",
      message: check.ok ? "PostgreSQL database is connected" : check.message,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
