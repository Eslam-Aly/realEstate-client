import { test, expect } from "@playwright/test";

const TEST_OWNER_EMAIL = process.env.TEST_OWNER_EMAIL!;
const TEST_OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD!;

test.describe("Aqardot - Sign In Page", () => {
  test("renders email, password, submit and login link in navbar", async ({
    page,
  }) => {
    await page.goto("/signin");

    // Navbar state
    await expect(page.getByTestId("navbar-login-link")).toBeVisible();

    // Form fields
    await expect(page.getByTestId("signin-email")).toBeVisible();
    await expect(page.getByTestId("signin-password")).toBeVisible();
    await expect(page.getByTestId("signin-submit")).toBeVisible();

    // Later you can add:
    // - forgot password visible
    // - Google sign-in visible (OAuth component)
  });

  test("logs user in with valid credentials and shows profile link", async ({
    page,
  }) => {
    await page.goto("/signin");

    await page.getByTestId("signin-email").fill(TEST_OWNER_EMAIL);
    await page.getByTestId("signin-password").fill(TEST_OWNER_PASSWORD);
    await page.getByTestId("signin-submit").click();

    // Remote environments can take a bit longer to respond, so wait for the redirect home.
    await expect(page).toHaveURL(/\/$/, { timeout: 20000 });

    // After login we expect navbar to show profile avatar link
    await expect(page.getByTestId("navbar-profile-link")).toBeVisible();
    await expect(page.getByTestId("navbar-login-link")).toHaveCount(0);
  });
});
