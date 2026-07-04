/** Whether Drizzle / DB health checks are active. */
export function isDatabaseEnabled(): boolean {
  const flag = process.env.DB_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  if (flag === "true" || flag === "1" || flag === "yes") return true;

  const url = process.env.DATABASE_URL?.trim().toLowerCase();
  if (!url || url === "off" || url === "false" || url === "none") return false;

  return true;
}
