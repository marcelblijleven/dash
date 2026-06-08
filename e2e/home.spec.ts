import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the dash header", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /dash/i }).first(),
    ).toBeVisible();
  });

  test("has the expected document title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/dash/i);
  });
});
