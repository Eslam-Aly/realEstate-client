import { test, expect } from "@playwright/test";

test.describe("Aqardot - Homepage", () => {
  test("Homepage is up and search bar is visible", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Aqardot/i);
    await expect(page.getByTestId("navbar")).toBeVisible();
    await expect(page.getByTestId("home-search-bar")).toBeVisible();
    await expect(page.getByTestId("home-search-input")).toBeVisible();
  });
});
