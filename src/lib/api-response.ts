import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

export function handleDatabaseError(error: unknown) {
  const err = error as { code?: string; message?: string; detail?: string };
  console.error("[API Error Handler]:", err.message || error);

  // PostgreSQL Unique Violation (e.g., duplicate email)
  if (err.code === "23505") {
    return errorResponse(
      "A user with this email address already exists.",
      409
    );
  }

  // DNS Resolution Failed (hostname not found)
  if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND")) {
    return errorResponse(
      "Database hostname not found (ENOTFOUND). Please check PGHOST in your environment variables to match the exact private hostname shown in the tool's Networking tab.",
      503
    );
  }

  // PostgreSQL Connection Refused / Timeout / Auth Failed
  if (
    err.code === "ECONNREFUSED" ||
    err.code === "ETIMEDOUT" ||
    err.code === "28P01" ||
    err.code === "3D000" ||
    err.message?.includes("connect ECONNREFUSED") ||
    err.message?.includes("password authentication failed")
  ) {
    return errorResponse(
      "Database connection failed. Please ensure PostgreSQL is running and credentials in environment variables are correct.",
      503
    );
  }

  // Missing table or schema error
  if (err.code === "42P01") {
    return errorResponse(
      "Database schema not initialized. Please visit /api/migrate to initialize the database tables.",
      500
    );
  }

  // Fallback safe error message with clean description
  return errorResponse(
    err.message ? `Database error: ${err.message}` : "An unexpected database error occurred. Please try again later.",
    500
  );
}

