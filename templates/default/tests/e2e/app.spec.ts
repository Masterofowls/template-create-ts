import { expect, test } from "@playwright/test";

test.describe("{{PROJECT_NAME}} E2E", () => {
  test("homepage loads with project title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("{{PROJECT_NAME}}");
  });

  test("API health endpoint responds", async ({ request }) => {
    const response = await request.get("http://localhost:9001/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.framework).toBeTruthy();
  });

  test("echo endpoint sanitizes input", async ({ request }) => {
    const response = await request.get(
      "http://localhost:9001/api/echo?message=%3Cscript%3Ealert(1)%3C/script%3E",
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.message).not.toContain("<script>");
  });
});
