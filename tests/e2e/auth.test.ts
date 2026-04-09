import { test, expect } from "@playwright/test";

/**
 * Auth E2E tests.
 *
 * Prerequisites (handled by CI seed / local `npm run db:seed`):
 *   - test@example.com / TestPassword123! exists in the DB
 *
 * The sign-up test generates a unique email per run to avoid conflicts.
 */

const SEED_EMAIL = "test@example.com";
const SEED_PASSWORD = "TestPassword123!";

test.describe("Protected route redirect", () => {
  test("unauthenticated user visiting /dashboard is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(
      page.getByRole("heading", { name: /paperclip alt/i })
    ).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("callbackUrl is preserved in the redirect", async ({ page }) => {
    await page.goto("/dashboard/issues");
    await expect(page).toHaveURL(/callbackUrl/);
  });
});

test.describe("Sign up", () => {
  test("creates a new account and redirects to login", async ({ page }) => {
    const uniqueEmail = `e2e-signup-${Date.now()}@example.com`;

    await page.goto("/auth/register");
    await expect(page.getByText("Create your account")).toBeVisible();

    await page.fill('[name="name"]', "E2E Test User");
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', "SecurePass123!");
    await page.getByRole("button", { name: "Create account" }).click();

    // After successful registration, the client redirects to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("shows error when email is already taken", async ({ page }) => {
    await page.goto("/auth/register");

    await page.fill('[name="name"]', "Duplicate User");
    await page.fill('[name="email"]', SEED_EMAIL); // already exists via seed
    await page.fill('[name="password"]', "SecurePass123!");
    await page.getByRole("button", { name: "Create account" }).click();

    // Should stay on register page with an error message
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(
      page.getByText(/already exists|already taken|account with this email/i)
    ).toBeVisible();
  });
});

test.describe("Sign in", () => {
  test("valid credentials redirect to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Sign in to continue")).toBeVisible();

    await page.fill('[name="email"]', SEED_EMAIL);
    await page.fill('[name="password"]', SEED_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("wrong password shows error and stays on login page", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('[name="email"]', SEED_EMAIL);
    await page.fill('[name="password"]', "WrongPassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("unknown email shows error and stays on login page", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('[name="email"]', "nobody@nowhere.example.com");
    await page.fill('[name="password"]', "SomePassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });
});

test.describe("Session persistence", () => {
  test("session survives a full page reload", async ({ page }) => {
    // Sign in
    await page.goto("/auth/login");
    await page.fill('[name="email"]', SEED_EMAIL);
    await page.fill('[name="password"]', SEED_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload and confirm we are still on the dashboard
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.url()).not.toMatch(/\/auth\/login/);
  });

  test("authenticated user visiting /auth/login is redirected to dashboard", async ({
    page,
  }) => {
    // Sign in
    await page.goto("/auth/login");
    await page.fill('[name="email"]', SEED_EMAIL);
    await page.fill('[name="password"]', SEED_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Attempt to navigate back to login — middleware should redirect away
    await page.goto("/auth/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
