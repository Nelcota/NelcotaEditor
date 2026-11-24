import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";

const HTTP_NOT_FOUND = 404;

test("answers an unknown address with a 404 page that leads home", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(HTTP_NOT_FOUND);
    await expect(page).toHaveTitle(/Página não encontrada/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página não encontrada");
    await expect(page.getByRole("link", { name: /início/i })).toBeVisible();
    await expectNoAccessibilityViolations(page);
});
