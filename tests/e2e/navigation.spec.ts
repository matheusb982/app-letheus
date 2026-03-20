import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.getByRole("link", { name: /criar conta|registr/i });
    await expect(registerLink).toBeVisible();
  });

  test("register page has link to login", async ({ page }) => {
    await page.goto("/register");
    const loginLink = page.getByRole("link", { name: /entrar|login/i });
    await expect(loginLink).toBeVisible();
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
