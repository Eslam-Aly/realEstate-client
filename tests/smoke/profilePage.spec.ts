import { test, expect } from "@playwright/test";

const TEST_OWNER_EMAIL = process.env.TEST_OWNER_EMAIL!;
const TEST_OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD!;

async function signInAsTestUser(page) {
  await page.goto("/signin");
  await page.getByTestId("signin-email").fill(TEST_OWNER_EMAIL);
  await page.getByTestId("signin-password").fill(TEST_OWNER_PASSWORD);
  await page.getByTestId("signin-submit").click();
  // Remote deployments can take longer to establish the session & redirect.
  await expect(page).toHaveURL(/\/$/, { timeout: 20000 });
  await expect(page.getByTestId("navbar-profile-link")).toBeVisible();
}

test.describe("Aqardot - Profile Page", () => {
  test("profile is accessible after login and logout works", async ({
    page,
  }) => {
    // 🔐 Login first
    await signInAsTestUser(page);

    // 👤 Go to profile
    await page.getByTestId("navbar-profile-link").click();

    // Optional: add data-testid="profile-page" on root div of profile page
    // and assert it here:
    // await expect(page.getByTestId("profile-page")).toBeVisible();

    // 🚪 Click logout
    await page.getByTestId("profile-logout-button").click();

    // ✅ After logout we expect "Sign in" link back in navbar
    await expect(page.getByTestId("navbar-login-link")).toBeVisible();
    await expect(page.getByTestId("navbar-profile-link")).toHaveCount(0);
  });
});
