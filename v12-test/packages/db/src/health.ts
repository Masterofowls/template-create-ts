import { sql } from "drizzle-orm";
import { db, dialect } from "./index.ts";

export type DbHealthStatus = "ok" | "degraded";

export async function checkDatabaseHealth(): Promise<{
  status: DbHealthStatus;
  dialect: string;
}> {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok", dialect };
  } catch {
    return { status: "degraded", dialect };
  }
}
