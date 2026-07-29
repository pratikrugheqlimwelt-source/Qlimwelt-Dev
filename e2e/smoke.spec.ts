import { test, expect } from "@playwright/test";

test.describe("Qlimwelt smoke", () => {
  test("marketing home loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toContainText(/sign|login|google|qlimwelt/i);
  });

  test("platform page loads", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("body")).toBeVisible();
  });

  test("qlim AI status endpoint responds", async ({ request }) => {
    const res = await request.get("/api/qlim-ai/chat");
    expect(res.status()).toBeLessThan(500);
    const json = await res.json();
    expect(json).toHaveProperty("provider");
    expect(json).toHaveProperty("model");
  });

  test("dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/overview");
    await expect(page).toHaveURL(/login|onboarding|dashboard/);
  });
});
