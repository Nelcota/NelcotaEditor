import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test.beforeEach(async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
});

test("shows a first-time library and opens the new video dialog", async ({ page }) => {
    await openPage(page, "/videos");
    await expectNoAccessibilityViolations(page);

    await page.getByRole("link", { name: "Novo vídeo" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Cole o link do YouTube")).toBeFocused();
    await expectNoAccessibilityViolations(page);
});

test("keeps the app layout on the 404 page of a missing video's Studio", async ({ page }) => {
    const response = await page.goto("/videos/0190a6c5-0000-7000-8000-000000000000?tab=studio");

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/Página não encontrada/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página não encontrada");
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expectNoAccessibilityViolations(page);
});
