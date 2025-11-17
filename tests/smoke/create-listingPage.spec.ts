import { test, expect } from "@playwright/test";

const TEST_OWNER_EMAIL = process.env.TEST_OWNER_EMAIL!;
const TEST_OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD!;

async function signInAsTestUser(page) {
  await page.goto("/signin");
  await page.getByTestId("signin-email").fill(TEST_OWNER_EMAIL);
  await page.getByTestId("signin-password").fill(TEST_OWNER_PASSWORD);
  await page.getByTestId("signin-submit").click();
  await expect(page.getByTestId("navbar-profile-link")).toBeVisible();
}

test.describe("Aqardot - Create Listing", () => {
  test("Owner can create a basic listing from profile page", async ({
    page,
  }) => {
    // 1) Login
    await signInAsTestUser(page);

    // 2) Go to profile
    await page.getByTestId("navbar-profile-link").click();

    // 3) Click 'Create Listing'
    await page.getByTestId("profile-create-listing-link").click();
    await expect(page).toHaveURL(/\/createlistingform/);

    // 4) Fill minimal form
    const title = `Smoke Test Listing ${Date.now()}`;

    await page.getByTestId("create-title").fill(title);
    await page.getByTestId("create-purpose").selectOption("rent");
    await page.getByTestId("create-category").selectOption("apartment");

    await page.getByTestId("create-price").fill("5000");
    await page.getByTestId("create-size").fill("120");
    await page.getByTestId("create-bedrooms").selectOption("3");
    await page.getByTestId("create-bathrooms").selectOption("2");

    // Floor (select) – use first non-placeholder option
    await page.getByTestId("create-floor").selectOption({ index: 1 });

    // Contact phone (required)
    await page.getByTestId("create-contact-phone").fill("01001234567");

    // Location (adjust options to your real values)
    await page.getByTestId("create-governorate").selectOption("cairo");
    await page.getByTestId("create-city").selectOption("nasr-city");

    // Upload image (make sure file exists)
    await page
      .getByTestId("create-images-input")
      .setInputFiles("public/logoBlue.png");

    // Description (textarea)
    await page
      .getByTestId("create-description")
      .fill("Smoke test: nice 3-bedroom apartment in Cairo.");

    // 5) Submit
    await page.getByTestId("create-submit").click();

    // 6) Assert success:
    // Option A: success toast text
    // await expect(page.getByText(/listing created successfully/i)).toBeVisible();

    // Option B: redirect to listing details page and see title
    await expect(page).toHaveURL(/\/listing[s]?\/.+/);
    await expect(page.getByTestId("listing-title")).toContainText(title);
  });
});
