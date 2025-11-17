import { test, expect } from "@playwright/test";

test.describe("Aqardot - Listing Details", () => {
  test("User can open listing details from search and see main actions", async ({
    page,
  }) => {
    // Start from search and click first card
    await page.goto("/search?searchTerm=cairo");

    const cards = page.getByTestId("listing-card");
    await expect(cards.first()).toBeVisible();

    await cards.first().click();

    // On listing details page
    await expect(page).toHaveURL(/\/listing[s]?\/.+/);

    await expect(page.getByTestId("listing-images")).toBeVisible();
    await expect(page.getByTestId("listing-title")).toBeVisible();
    await expect(page.getByTestId("listing-price")).toBeVisible();

    await expect(page.getByTestId("listing-favorite-button")).toBeVisible();
    await expect(page.getByTestId("listing-share-button")).toBeVisible();
    await expect(page.getByTestId("listing-call-seller-button")).toBeVisible();
    await expect(
      page.getByTestId("listing-contact-whatsapp-button")
    ).toBeVisible();

    // Owner-only buttons can be added here later after login flow:
    // await expect(page.getByTestId("listing-owner-edit-button")).toBeVisible();
    // await expect(page.getByTestId("listing-owner-delete-button")).toBeVisible();
  });
});
