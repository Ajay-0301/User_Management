/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool, Client } = require("pg");

// Load .env and .env.local if present
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Ignore
}

const getSsl = () => {
  const pgSsl = (process.env.PGSSL || process.env.PGSSLMODE || process.env.POSTGRES_SSL || "").toLowerCase();
  if (pgSsl === "false" || pgSsl === "disable" || pgSsl === "off") {
    return false;
  }
  if (pgSsl === "true" || pgSsl === "require" || pgSsl === "prefer") {
    return { rejectUnauthorized: false };
  }
  return false;
};

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const config = connectionString
  ? { connectionString, ssl: getSsl() }
  : {
      host: process.env.PGHOST || process.env.POSTGRES_HOST || process.env.DB_HOST || "localhost",
      port: parseInt(process.env.PGPORT || process.env.POSTGRES_PORT || process.env.DB_PORT || "5432", 10),
      user: process.env.PGUSER || process.env.POSTGRES_USER || process.env.DB_USER || "postgres",
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || "",
      database: process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || "postgres",
      ssl: getSsl(),
    };

async function ensureDatabaseExists() {
  if (connectionString) return; // Skip if using direct connection string

  const targetDb = config.database;
  if (!targetDb || targetDb === "postgres") return;

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
      if (/^[a-zA-Z0-9_]+$/.test(targetDb)) {
        await adminClient.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`✓ Database "${targetDb}" created successfully.`);
      }
    }
  } catch (err) {
    console.warn(`[Migration Notice] Database existence check notice: ${err.message}`);
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
  console.log(`Host:     ${config.host || "via connectionString"}`);
  console.log(`Port:     ${config.port || "default"}`);
  console.log(`User:     ${config.user || "default"}`);
  console.log(`Database: ${config.database || "default"}`);
  console.log(`SSL:      ${Boolean(config.ssl)}`);
  console.log("-----------------------------------------");

  await ensureDatabaseExists();

  const pool = new Pool(config);

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
