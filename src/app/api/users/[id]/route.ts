import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  errorResponse,
  handleDatabaseError,
  successResponse,
} from "@/lib/api-response";
import { User } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseUserId(idParam: string): number | null {
  const id = parseInt(idParam, 10);
  if (isNaN(id) || id <= 0) {
    return null;
  }
  return id;
}

/**
 * GET /api/users/[id]
 * Fetch a single user by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseUserId(params.id);
    if (!userId) {
      return errorResponse("Invalid user ID provided", 400);
    }

    const sql = `
      SELECT id, full_name, email, phone, department, job_role, status, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await query<User>(sql, [userId]);

    if (result.rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    return successResponse(result.rows[0]);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PUT /api/users/[id]
 * Update an existing user's information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseUserId(params.id);
    if (!userId) {
      return errorResponse("Invalid user ID provided", 400);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON payload in request body", 400);
    }

    // Check if user exists
    const checkSql = "SELECT id FROM users WHERE id = $1;";
    const checkResult = await query(checkSql, [userId]);
    if (checkResult.rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const department = typeof body.department === "string" ? body.department.trim() : null;
    const jobRole = typeof body.job_role === "string" ? body.job_role.trim() : null;
    const status = body.status === "Inactive" ? "Inactive" : "Active";

    // Validations
    if (!fullName) {
      return errorResponse("Full Name is required.", 400);
    }
    if (fullName.length > 150) {
      return errorResponse("Full Name must not exceed 150 characters.", 400);
    }

    if (!email) {
      return errorResponse("Email Address is required.", 400);
    }
    if (email.length > 255) {
      return errorResponse("Email Address must not exceed 255 characters.", 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      return errorResponse("Please provide a valid email address.", 400);
    }

    if (phone && phone.length > 20) {
      return errorResponse("Phone number must not exceed 20 characters.", 400);
    }
    if (department && department.length > 100) {
      return errorResponse("Department must not exceed 100 characters.", 400);
    }
    if (jobRole && jobRole.length > 100) {
      return errorResponse("Job Role must not exceed 100 characters.", 400);
    }

    const updateSql = `
      UPDATE users
      SET full_name = $1,
          email = $2,
          phone = $3,
          department = $4,
          job_role = $5,
          status = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING id, full_name, email, phone, department, job_role, status, created_at, updated_at;
    `;

    const updateResult = await query<User>(updateSql, [
      fullName,
      email,
      phone || null,
      department || null,
      jobRole || null,
      status,
      userId,
    ]);

    return successResponse(
      updateResult.rows[0],
      "User updated successfully"
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user from PostgreSQL
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseUserId(params.id);
    if (!userId) {
      return errorResponse("Invalid user ID provided", 400);
    }

    const deleteSql = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, full_name, email;
    `;
    const result = await query<{ id: number; full_name: string; email: string }>(
      deleteSql,
      [userId]
    );

    if (result.rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      result.rows[0],
      `User "${result.rows[0].full_name}" deleted successfully`
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

