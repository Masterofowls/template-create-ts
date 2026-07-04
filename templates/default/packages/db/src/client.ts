import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { isDatabaseEnabled } from "./config.ts";
import { resolveDatabaseUrl } from "./resolve-url.ts";
import * as schema from "./schema.ts";

type AppDatabase = LibSQLDatabase<typeof schema> | NodePgDatabase<typeof schema>;

let dbInstance: AppDatabase | null = null;

function resolveDialect(databaseUrl: string): string {
  const configured = process.env.DB_DIALECT ?? "sqlite";
  return databaseUrl.startsWith("postgres") ? "postgresql" : configured;
}

function createDb(databaseUrl: string): AppDatabase {
  const dialect = resolveDialect(databaseUrl);
  if (dialect === "postgresql" || databaseUrl.startsWith("postgres")) {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    return drizzlePostgres(pool, { schema });
  }

  const client = createClient({ url: databaseUrl });
  return drizzleLibsql(client, { schema });
}

export function getDb(): AppDatabase {
  if (!isDatabaseEnabled()) {
    throw new Error(
      "Database is disabled. Set DB_ENABLED=true and run `bun run db:push` when ready.",
    );
  }
  if (!dbInstance) {
    const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:packages/db/local.db");
    dbInstance = createDb(databaseUrl);
  }
  return dbInstance;
}

export function getDialect(): string {
  if (!isDatabaseEnabled()) return "none";
  const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:packages/db/local.db");
  return resolveDialect(databaseUrl);
}

export { schema };
