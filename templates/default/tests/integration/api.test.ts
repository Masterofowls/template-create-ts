import { checkDatabaseHealth } from "@pkg/db";
import { sanitizeText } from "@pkg/shared/security";
import { describe, expect, it } from "vitest";

describe("API integration", () => {
  it("checks database health", async () => {
    const result = await checkDatabaseHealth();
    expect(["ok", "degraded", "disabled"]).toContain(result.status);
    expect(result.dialect).toBeTruthy();
  });

  it("sanitizes echo-style payloads", () => {
    const message = sanitizeText("<script>alert(1)</script>hello");
    expect(message).not.toContain("<script>");
    expect(message).toContain("hello");
  });
});
