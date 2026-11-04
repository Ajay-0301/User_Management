import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { handleDatabaseError } from "@/lib/api-response";
import { DashboardStats, DepartmentCount, User } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Overall counts (Total, Active, Inactive, Recently Added in last 30 days)
    const metricsSql = `
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(CASE WHEN status = 'Active' THEN 1 END)::int AS active_users,
        COUNT(CASE WHEN status = 'Inactive' THEN 1 END)::int AS inactive_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::int AS recently_added_users
      FROM users;
    `;
    const metricsResult = await query<{
      total_users: number;
      active_users: number;
      inactive_users: number;
      recently_added_users: number;
    }>(metricsSql);

    const metrics = metricsResult.rows[0] || {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      recently_added_users: 0,
    };

    // 2. Department distribution
    const deptSql = `
      SELECT
        COALESCE(NULLIF(department, ''), 'Unassigned') AS department,
        COUNT(*)::int AS count
      FROM users
      GROUP BY department
      ORDER BY count DESC;
    `;
    const deptResult = await query<DepartmentCount>(deptSql);

    // 3. Top 5 recently registered users
    const recentUsersSql = `
      SELECT id, full_name, email, phone, department, job_role, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    const recentResult = await query<User>(recentUsersSql);

    const stats: DashboardStats = {
      totalUsers: Number(metrics.total_users),
      activeUsers: Number(metrics.active_users),
      inactiveUsers: Number(metrics.inactive_users),
      recentlyAddedUsers: Number(metrics.recently_added_users),
      departments: deptResult.rows,
      recentUsers: recentResult.rows,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

