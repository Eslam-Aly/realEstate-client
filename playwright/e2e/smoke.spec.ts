import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const timestamp = Date.now();
const defaultListingTitle =
  process.env.E2E_LISTING_TITLE || `Smoke Test Listing ${timestamp}`;
let createdListingTitle: string = "";

test("Owner can sign up with a fresh account", async ({ page }) => {
  const unique = Date.now();
  const email =
    process.env.E2E_SIGNUP_EMAIL ||
    `owner.smoke.${unique}@example.com`.toLowerCase();
  const password = process.env.E2E_SIGNUP_PASSWORD || `Smoke!${unique}`;
  const username = process.env.E2E_SIGNUP_USERNAME || `owner-smoke-${unique}`;

  await page.goto("/signup");
  await page.fill("#username", username);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.locator('[data-testid="signup-submit"]').click({ force: true });
  await expect(page).toHaveURL(/\/signin(\?verify=sent)?/i);
});

test("Owner can sign in and create a listing", async ({ page }) => {
  test.skip(
    !process.env.E2E_OWNER_EMAIL || !process.env.E2E_OWNER_PASSWORD,
    "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run owner creation smoke test."
  );
  const ownerEmail = process.env.E2E_OWNER_EMAIL || "";
  const ownerPassword = process.env.E2E_OWNER_PASSWORD || "";
  const listingTitle = `${defaultListingTitle} ${Date.now()}`;

  await page.goto("/signin");
  await page.fill("#email", ownerEmail);
  await page.fill("#password", ownerPassword);
  await page.click('form button[type="submit"]');
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/createlistingform");
  await page.selectOption('[data-testid="purpose-select"]', "rent");
  await page.selectOption('[data-testid="category-select"]', "apartment");

  await page.fill('[data-testid="field-title"]', listingTitle);
  await page.fill(
    '[data-testid="field-description"]',
    "Smoke test listing generated automatically. Please ignore."
  );
  await page.fill('[data-testid="field-price"]', "123456");
  await page.fill('[data-testid="field-size"]', "120");
  await page.selectOption('[data-testid="field-bedrooms"]', "2");
  await page.selectOption('[data-testid="field-bathrooms"]', "2");
  await page.selectOption('[data-testid="field-floor"]', "1");

  await waitAndSelectFirstOption(page, '[data-testid="gov-select"]');
  await waitAndSelectFirstOption(page, '[data-testid="city-select"]');
  const areaSelect = page.locator('[data-testid="area-select"]');
  if (await areaSelect.isVisible().catch(() => false)) {
    await waitAndSelectFirstOption(page, '[data-testid="area-select"]');
  }

  await page.fill('[data-testid="contact-phone"]', "+201000000000");

  await page.click('form button[type="submit"]');
  await page.waitForURL(/\/listing\//, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: listingTitle })
  ).toBeVisible();

  createdListingTitle = listingTitle;
});

test("Client can search for a listing and send a contact message", async ({
  page,
}) => {
  const listingQuery =
    createdListingTitle || process.env.E2E_LISTING_QUERY || "Smoke";
  const contactEmail =
    process.env.E2E_CLIENT_EMAIL ||
    `client.smoke.${Date.now()}@example.com`.toLowerCase();

  await page.goto("/");
  const headerSearch = page.locator("header input[type='text']").first();
  await headerSearch.fill(listingQuery);
  await headerSearch.press("Enter");
  await page.waitForURL(/\/search/i);

  const listingCard = page.locator("a", { hasText: listingQuery }).first();
  await expect(listingCard).toBeVisible({ timeout: 20_000 });
  await listingCard.click();
  await page.waitForURL(/\/listing\//);
  await expect(page.locator("h1")).toContainText(listingQuery, {
    timeout: 20_000,
  });

  await page.goto("/contact");
  await page.fill("#name", "Smoke Test Client");
  await page.fill("#email", contactEmail);
  await page.fill("#subject", "Smoke Test Inquiry");
  await page.fill("#message", "E2E smoke test message. Please ignore.");
  await page.click('[data-testid="contact-form"] button[type="submit"]');
  await expect(page.locator('[data-testid="contact-success"]')).toBeVisible({
    timeout: 20_000,
  });
});

async function waitAndSelectFirstOption(page, selector: string) {
  const option = page.locator(`${selector} option:not([value=""])`).first();
  await option.waitFor({ timeout: 20_000 });
  const value = await option.getAttribute("value");
  if (value) {
    await page.selectOption(selector, value);
  }
}
