import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { loadConfig } from "@/lib/config/loader";

type PoolKey = string;

declare global {
  var __dashTeslaPools: Map<PoolKey, Pool> | undefined;
}

globalThis.__dashTeslaPools ??= new Map();
const pools = globalThis.__dashTeslaPools;

function poolKey(opts: {
  host: string;
  port: number;
  database: string;
  user: string;
}): PoolKey {
  return `${opts.host}:${opts.port}/${opts.database}|${opts.user}`;
}

async function getPool(): Promise<Pool | null> {
  const { config } = await loadConfig();
  const pg = config.teslamate?.postgres;
  if (!pg) return null;

  const key = poolKey(pg);
  let pool = pools.get(key);
  if (pool) return pool;

  if (typeof pg.password !== "string") {
    throw new Error(
      `teslamate.postgres.password must be a string (got ${typeof pg.password}). YAML parses values like 12345 or yes as non-strings; quote the password in config.yml, e.g. password: "your-password"`,
    );
  }
  if (pg.password.length === 0) {
    throw new Error(
      "teslamate.postgres.password is empty. Set it in config.yml or via the env var it references",
    );
  }

  const { Pool: PgPool } = await import("pg");
  pool = new PgPool({
    host: pg.host,
    port: pg.port,
    database: pg.database,
    user: pg.user,
    password: pg.password,
    ssl: pg.ssl ? { rejectUnauthorized: false } : undefined,
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on("error", (err) => {
    console.error("[dash:teslamate-pg] pool error", err.message);
  });
  pools.set(key, pool);
  console.log(
    `[dash:teslamate-pg] pool created for ${pg.host}:${pg.port}/${pg.database}`,
  );
  return pool;
}

export class TeslamatePostgresNotConfigured extends Error {
  constructor() {
    super(
      "teslamate.postgres is not configured in config.yml. Required for teslamate stats widgets",
    );
    this.name = "TeslamatePostgresNotConfigured";
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = await getPool();
  if (!pool) throw new TeslamatePostgresNotConfigured();
  return pool.query<T>(sql, params);
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  if (!pool) throw new TeslamatePostgresNotConfigured();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
