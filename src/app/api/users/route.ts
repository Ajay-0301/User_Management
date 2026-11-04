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
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  id: "id",
  full_name: "full_name",
  email: "email",
  department: "department",
  job_role: "job_role",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

/**
 * GET /api/users
 * Fetch paginated users with optional search and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    const sortByParam = searchParams.get("sortBy") || "created_at";
    const sortOrderParam = searchParams.get("sortOrder")?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const sortColumn = ALLOWED_SORT_COLUMNS[sortByParam] || "created_at";

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Search condition across full_name, email, department, job_role
    if (search) {
      conditions.push(
        `(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR department ILIKE $${paramIndex} OR job_role ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by department
    if (department && department !== "all") {
      conditions.push(`department = $${paramIndex}`);
      values.push(department);
      paramIndex++;
    }

    // Filter by status
    if (status && status !== "all") {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Total count query
    const countSql = `SELECT COUNT(*) AS total FROM users ${whereClause};`;
    const countResult = await query<{ total: string }>(countSql, values);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    // 2. Paginated data query
    const dataValues = [...values, limit, offset];
    const dataSql = `
      SELECT id, full_name, email, phone, department, job_role, status, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrderParam}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    const dataResult = await query<User>(dataSql, dataValues);
    const totalPages = Math.ceil(total / limit) || 1;

    return successResponse({
      users: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/users
 * Create a new user with validation and parameterized INSERT query
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON payload in request body", 400);
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

    // Execute parameterized INSERT
    const insertSql = `
      INSERT INTO users (full_name, email, phone, department, job_role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name, email, phone, department, job_role, status, created_at, updated_at;
    `;

    const result = await query<User>(insertSql, [
      fullName,
      email,
      phone || null,
      department || null,
      jobRole || null,
      status,
    ]);

    const createdUser = result.rows[0];

    return successResponse(createdUser, "User created successfully", 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

