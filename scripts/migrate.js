/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool, Client } = require("pg");

// Load .env and .env.local if present
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Ignore if dotenv is not yet installed or files don't exist
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

async function ensureDatabaseExists() {
  const targetDb = config.database;
  const adminClient = new Client({
    ...config,
    database: "postgres",
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (res.rowCount === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating it now...`);
      // Database names cannot be parameterized in CREATE DATABASE, validate identifier safely
      if (/^[a-zA-Z0-9_]+$/.test(targetDb)) {
        await adminClient.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`✓ Database "${targetDb}" created successfully.`);
      } else {
        throw new Error(`Invalid database name: ${targetDb}`);
      }
    }
  } catch (err) {
    // If admin connection fails, we log and proceed — target database might already exist or admin access is restricted
    console.warn(`[Migration Check] Notice while checking database existence: ${err.message}`);
  } finally {
    try {
      await adminClient.end();
    } catch {
      // Ignore cleanup error
    }
  }
}

async function runMigrations() {
  console.log("=========================================");
  console.log("   Starting Database Migrations");
  console.log("=========================================");
  console.log(`Host:     ${config.host}`);
  console.log(`Port:     ${config.port}`);
  console.log(`User:     ${config.user}`);
  console.log(`Database: ${config.database}`);
  console.log(`SSL:      ${Boolean(config.ssl)}`);
  console.log("-----------------------------------------");

  await ensureDatabaseExists();

  const pool = new Pool(config);

  const client = await pool.connect();
  try {
    // 1. Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read migration files
    const migrationsDir = path.resolve(__dirname, "../migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log(`No migrations directory found at ${migrationsDir}`);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No .sql migration files found.");
      return;
    }

    // 3. Query already executed migrations
    const executedRes = await client.query(
      "SELECT name FROM schema_migrations"
    );
    const executedSet = new Set(executedRes.rows.map((r) => r.name));

    let appliedCount = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`  [SKIPPED]  ${file} (already executed)`);
        continue;
      }

      console.log(`  [RUNNING]  ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`  ✓ [APPLIED]  ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query("ROLLBACK");
        console.error(`  ✗ [FAILED]   ${file}`);
        console.error(`Error details: ${migrationErr.message}`);
        throw migrationErr;
      }
    }

    console.log("-----------------------------------------");
    console.log(
      `Migration completed. ${appliedCount} new migration(s) applied successfully.`
    );
    console.log("=========================================");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

