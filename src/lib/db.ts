import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as {
  pool: Pool | undefined;
};

// Determine SSL options based on environment variables
const getSslConfig = () => {
  const pgSsl = (process.env.PGSSL || process.env.PGSSLMODE || process.env.POSTGRES_SSL || "").toLowerCase();
  const nodeEnv = process.env.NODE_ENV;

  // Explicitly disabled
  if (pgSsl === "false" || pgSsl === "disable" || pgSsl === "off") {
    return false;
  }

  // Explicitly enabled
  if (pgSsl === "true" || pgSsl === "require" || pgSsl === "prefer" || (nodeEnv === "production" && pgSsl === "require")) {
    return {
      rejectUnauthorized: false,
    };
  }

  return false;
};

// Build pool configuration supporting connection strings or individual variables
function createPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    return {
      connectionString,
      ssl: getSslConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host: process.env.PGHOST || process.env.POSTGRES_HOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
    user: process.env.PGUSER || process.env.POSTGRES_USER || process.env.DB_USER || "postgres",
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || "postgres",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: getSslConfig(),
  };
}

export const pool = globalForPg.pool ?? new Pool(createPoolConfig());

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
