import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        job_role VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`);

    // 3. Seed sample users if table is empty
    const countRes = await query<{ count: string }>("SELECT COUNT(*) FROM users;");
    let seeded = 0;
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      const sampleUsers = [
        ["Sarah Jenkins", "sarah.jenkins@acme.corp", "+1 (555) 234-5678", "Engineering", "Staff Software Engineer", "Active"],
        ["Marcus Vance", "marcus.vance@acme.corp", "+1 (555) 345-6789", "Product", "Product Manager", "Active"],
        ["Elena Rostova", "elena.rostova@acme.corp", "+1 (555) 456-7890", "Design", "Lead UI/UX Designer", "Active"],
        ["David Kim", "david.kim@acme.corp", "+1 (555) 567-8901", "Engineering", "DevOps Architect", "Active"],
        ["Priya Patel", "priya.patel@acme.corp", "+1 (555) 678-9012", "Marketing", "Growth Director", "Active"],
        ["Lucas Alvarez", "lucas.alvarez@acme.corp", "+1 (555) 789-0123", "Sales", "Account Executive", "Inactive"],
      ];

      for (const u of sampleUsers) {
        await query(
          `INSERT INTO users (full_name, email, phone, department, job_role, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING;`,
          u
        );
        seeded++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database schema migration applied successfully!",
      seeded_users: seeded,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

