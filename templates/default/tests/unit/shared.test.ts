import { healthResponseSchema } from "@pkg/shared/schemas";
import { hashValue, safeJsonParse, sanitizeText } from "@pkg/shared/security";
import { describe, expect, it } from "vitest";

describe("shared schemas", () => {
  it("validates health response", () => {
    const data = {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      framework: "hono",
      database: { status: "ok" as const, dialect: "sqlite" },
    };
    expect(healthResponseSchema.parse(data)).toEqual(data);
  });
});

describe("security utilities", () => {
  it("sanitizes XSS payloads", () => {
    const dirty = '<script>alert("xss")</script>Hello';
    const clean = sanitizeText(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Hello");
  });

  it("parses JSON safely", () => {
    const parsed = safeJsonParse<{ name: string }>('{"name":"test"}');
    expect(parsed.name).toBe("test");
  });

  it("hashes values consistently", () => {
    expect(hashValue("test")).toBe(hashValue("test"));
    expect(hashValue("test")).not.toBe(hashValue("other"));
  });
});
