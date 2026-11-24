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
