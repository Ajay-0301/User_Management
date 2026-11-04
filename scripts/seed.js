/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { Pool } = require("pg");

try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Ignore
}

const config = {
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "user_management_demo",
  ssl:
    process.env.PGSSL === "true" || process.env.PGSSL === "require"
      ? { rejectUnauthorized: false }
      : false,
};

const sampleUsers = [
  {
    full_name: "Sarah Jenkins",
    email: "sarah.jenkins@acme.corp",
    phone: "+1 (555) 234-5678",
    department: "Engineering",
    job_role: "Staff Software Engineer",
    status: "Active",
  },
  {
    full_name: "Marcus Vance",
    email: "marcus.vance@acme.corp",
    phone: "+1 (555) 345-6789",
    department: "Product",
    job_role: "Product Manager",
    status: "Active",
  },
  {
    full_name: "Elena Rostova",
    email: "elena.rostova@acme.corp",
    phone: "+1 (555) 456-7890",
    department: "Design",
    job_role: "Lead UI/UX Designer",
    status: "Active",
  },
  {
    full_name: "David Kim",
    email: "david.kim@acme.corp",
    phone: "+1 (555) 567-8901",
    department: "Engineering",
    job_role: "DevOps Architect",
    status: "Active",
  },
  {
    full_name: "Priya Patel",
    email: "priya.patel@acme.corp",
    phone: "+1 (555) 678-9012",
    department: "Marketing",
    job_role: "Growth Director",
    status: "Active",
  },
  {
    full_name: "Lucas Alvarez",
    email: "lucas.alvarez@acme.corp",
    phone: "+1 (555) 789-0123",
    department: "Sales",
    job_role: "Account Executive",
    status: "Inactive",
  },
  {
    full_name: "Chloe Dupont",
    email: "chloe.dupont@acme.corp",
    phone: "+1 (555) 890-1234",
    department: "Human Resources",
    job_role: "Talent Acquisition Lead",
    status: "Active",
  },
  {
    full_name: "Alexander Wright",
    email: "alexander.wright@acme.corp",
    phone: "+1 (555) 901-2345",
    department: "Finance",
    job_role: "Financial Analyst",
    status: "Inactive",
  },
];

async function seed() {
  console.log("Connecting to PostgreSQL to seed sample users...");
  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    try {
      const checkTable = await client.query(`
        SELECT to_regclass('public.users') as exists;
      `);

      if (!checkTable.rows[0].exists) {
        console.error("Table 'users' does not exist. Please run 'npm run db:migrate' first.");
        process.exit(1);
      }

      console.log("Inserting sample users...");
      let inserted = 0;
      for (const u of sampleUsers) {
        const res = await client.query(
          `INSERT INTO users (full_name, email, phone, department, job_role, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING
           RETURNING id;`,
          [u.full_name, u.email, u.phone, u.department, u.job_role, u.status]
        );
        if (res.rowCount > 0) inserted++;
      }
      console.log(`✓ Seed complete! ${inserted} new users inserted.`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    await pool.end();
  }
}

seed();

