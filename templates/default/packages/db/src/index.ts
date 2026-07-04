import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL ?? "{{DATABASE_URL}}";
const configuredDialect = process.env.DB_DIALECT ?? "{{DB_DIALECT}}";
export const dialect = databaseUrl.startsWith("postgres") ? "postgresql" : configuredDialect;

function createDb() {
  if (dialect === "postgresql" || databaseUrl.startsWith("postgres")) {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    return drizzlePostgres(pool, { schema });
  }

  const client = createClient({ url: databaseUrl });
  return drizzleLibsql(client, { schema });
}

export const db = createDb();

export { schema };
export * from "./schema.ts";
export * from "./health.ts";
