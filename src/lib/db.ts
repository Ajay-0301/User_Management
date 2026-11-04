import { Pool, QueryResult, QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as {
  pool: Pool | undefined;
};

// Determine SSL options based on environment variables
const getSslConfig = () => {
  const pgSsl = process.env.PGSSL?.toLowerCase();
  const nodeEnv = process.env.NODE_ENV;

  if (pgSsl === "true" || pgSsl === "require" || (nodeEnv === "production" && pgSsl !== "false")) {
    return {
      rejectUnauthorized: false,
    };
  }
  return false;
};

export const pool =
  globalForPg.pool ??
  new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "user_management_demo",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: getSslConfig(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

/**
 * Execute a parameterized SQL query safely
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 500) {
      console.warn(`[Slow Query ${duration}ms]: ${text}`);
    }
    return res;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; detail?: string };
    console.error("[Database Query Error]:", {
      code: err.code,
      message: err.message,
      query: text,
    });
    throw error;
  }
}

/**
 * Health check helper to test database connectivity
 */
export async function testConnection(): Promise<{ ok: boolean; message?: string }> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { ok: true };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const error = err as Error;
    return {
      ok: false,
      message: error.message || "Failed to connect to PostgreSQL database",
    };
  }
}

