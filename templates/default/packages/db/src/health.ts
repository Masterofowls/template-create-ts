import { sql } from "drizzle-orm";
import { getDb, getDialect } from "./client.ts";
import { isDatabaseEnabled } from "./config.ts";

export type DbHealthStatus = "ok" | "degraded" | "disabled";

export async function checkDatabaseHealth(): Promise<{
  status: DbHealthStatus;
  dialect: string;
}> {
  if (!isDatabaseEnabled()) {
    return { status: "disabled", dialect: "none" };
  }

  const dialect = getDialect();
  try {
    const db = getDb();
    const ping = sql`SELECT 1`;
    if (dialect === "postgresql") {
      await db.execute(ping);
    } else {
      await db.all(ping);
    }
    return { status: "ok", dialect };
  } catch {
    return { status: "degraded", dialect };
  }
}
