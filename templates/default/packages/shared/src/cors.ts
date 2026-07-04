/** Web dev origins accepted in addition to CORS_ORIGIN (IPv4/IPv6 localhost mismatch on Windows). */
export const LOCAL_WEB_ORIGINS = ["http://localhost:9000", "http://127.0.0.1:9000"] as const;

export function resolveCorsOrigin(
  requestOrigin: string | undefined,
  configuredOrigin: string,
): string | null {
  if (!requestOrigin) return configuredOrigin;
  const allowed = new Set<string>([configuredOrigin, ...LOCAL_WEB_ORIGINS]);
  return allowed.has(requestOrigin) ? requestOrigin : null;
}

export function allowedCorsOrigins(configuredOrigin: string): string[] {
  return [...new Set([configuredOrigin, ...LOCAL_WEB_ORIGINS])];
}
