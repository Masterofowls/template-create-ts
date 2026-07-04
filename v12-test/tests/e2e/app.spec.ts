import { expect, test } from "@playwright/test";

test.describe("v12-test E2E", () => {
  test("homepage loads with project title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("v12-test");
  });

  test("API health endpoint responds", async ({ request }) => {
    const response = await request.get("http://localhost:9001/health");
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.database).toBeTruthy();
  });

  test("echo endpoint sanitizes input", async ({ request }) => {
    const response = await request.get(
      "http://localhost:9001/api/echo?message=%3Cscript%3Ealert(1)%3C/script%3E",
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.message).not.toContain("<script>");
  });

  test("OpenAPI docs are served", async ({ request }) => {
    const response = await request.get("http://localhost:9001/docs");
    expect(response.ok()).toBeTruthy();
  });
});
