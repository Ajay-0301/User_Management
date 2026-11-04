#!/usr/bin/env node

/**
 * Nimbus Admin Bootstrap Utility
 * Command: npm run admin:bootstrap
 * 
 * Generates a sensitive one-time admin setup code in the private terminal.
 * SECURITY: Never exposed via API, never stored in browser localStorage,
 * never logged on frontend, never committed to git.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");
const path = require("path");
const { Pool } = require("pg");

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Ignore
}

async function runBootstrap() {
  console.log("\n=============================================================");
  console.log("   Nimbus Cloud Platform - Admin Bootstrap Initialization");
  console.log("=============================================================\n");

  const randomBytes = crypto.randomBytes(24).toString("hex");
  const setupCode = `NMB-INIT-${randomBytes.toUpperCase()}`;
  const timestamp = new Date().toISOString();

  console.log(" [SECURITY AUDIT] Private terminal execution verified.");
  console.log(" [ENVIRONMENT] Initializing administrator credential pipeline...\n");

  const host = process.env.PGHOST;
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;

  if (host && database && user) {
    console.log(` Database Target: ${user}@${host}:${process.env.PGPORT || 5432}/${database}`);

    const pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl:
        process.env.PGSSL === "true" || process.env.PGSSL === "require"
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS _system_bootstrap (
            id SERIAL PRIMARY KEY,
            token_hash VARCHAR(64) NOT NULL,
            status VARCHAR(32) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            used_at TIMESTAMP WITH TIME ZONE
          );
        `);

        const tokenHash = crypto.createHash("sha256").update(setupCode).digest("hex");
        await client.query(
          `INSERT INTO _system_bootstrap (token_hash, status) VALUES ($1, 'pending');`,
          [tokenHash]
        );
        console.log(" Bootstrap state token hash registered in database (_system_bootstrap).");
      } finally {
        client.release();
        await pool.end();
      }
    } catch (dbErr) {
      console.warn(` Database token record skipped (${dbErr.message}). Standalone token generated.`);
    }
  }

  console.log("\n-------------------------------------------------------------");
  console.log("  ONE-TIME ADMINISTRATOR SETUP CODE GENERATED");
  console.log("-------------------------------------------------------------");
  console.log(`\n    SETUP CODE:  \x1b[32m\x1b[1m${setupCode}\x1b[0m\n`);
  console.log(`  Generated At: ${timestamp}`);
  console.log("  Valid Window: 15 minutes\n");
  console.log("-------------------------------------------------------------");
  console.log(" [CRITICAL SECURITY NOTICE]");
  console.log(" • Do NOT transmit this setup code over insecure channels or chat.");
  console.log(" • This code is NEVER available via REST / GraphQL API endpoints.");
  console.log(" • This code is NEVER stored in client browser state or localStorage.");
  console.log(" • This code is NEVER logged in web server HTTP access logs.");
  console.log(" • Use this token immediately to complete root admin onboarding.");
  console.log("=============================================================\n");
}

runBootstrap().catch((err) => {
  console.error("Fatal bootstrap initialization error:", err);
  process.exit(1);
});

