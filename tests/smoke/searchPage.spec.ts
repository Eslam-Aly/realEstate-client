import { test, expect } from "@playwright/test";

test.describe("Aqardot - Search Page", () => {
  test("Search page shows at least one listing", async ({ page }) => {
    await page.goto("/search?searchTerm=cairo");

    await expect(page.getByTestId("listing-grid")).toBeVisible();

    const cards = page.getByTestId("listing-card");
    await expect(cards.first()).toBeVisible();
  });
});
