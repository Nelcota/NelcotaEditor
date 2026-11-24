import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test.beforeEach(async ({ page }) => {
    await useOwnClientAddress(page);
});

test("creates an account and lands on the home page", async ({ page }) => {
    const account = createTestAccount();

    await openPage(page, "/sign-up");
    await expectNoAccessibilityViolations(page);
    await signUp(page, account);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana.");
    await expectNoAccessibilityViolations(page);
});

test("signs in with an existing account", async ({ page, browser }) => {
    const account = createTestAccount();
    await signUp(page, account);
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await useOwnClientAddress(freshPage);

    await openPage(freshPage, "/sign-in");
    await expectNoAccessibilityViolations(freshPage);
    await freshPage.getByLabel("Email").fill(account.email);
    await freshPage.getByLabel("Senha", { exact: true }).fill(account.password);
    await freshPage.getByRole("button", { name: "Entrar" }).click();

    await expect(freshPage).toHaveURL("/");
    await freshContext.close();
});

test("sends a signed-out visitor to sign in", async ({ page }) => {
    await page.goto("/videos");

    await expect(page).toHaveURL(/\/sign-in/);
});
