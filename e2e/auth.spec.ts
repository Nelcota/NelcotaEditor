import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import {
    createTestAccount,
    openPage,
    readEmailedLink,
    signUp,
    useOwnClientAddress,
} from "./support/accounts";

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

test("resets a forgotten password through the emailed link", async ({ page, browser }) => {
    const account = createTestAccount();
    const newPassword = `nova-${account.password}`;
    await signUp(page, account);
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await useOwnClientAddress(freshPage);

    await openPage(freshPage, "/sign-in");
    await freshPage.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expectNoAccessibilityViolations(freshPage);
    await freshPage.getByLabel("Email").fill(account.email);
    await freshPage.getByRole("button", { name: "Enviar link" }).click();
    await expect(freshPage.getByRole("status")).toContainText(account.email);

    await openPage(freshPage, await readEmailedLink(account.email, "reset-password"));
    await expectNoAccessibilityViolations(freshPage);
    await freshPage.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await freshPage.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(freshPage.getByRole("status")).toContainText("Senha alterada");
    await freshPage.getByLabel("Email").fill(account.email);
    await freshPage.getByLabel("Senha", { exact: true }).fill(newPassword);
    await freshPage.getByRole("button", { name: "Entrar" }).click();

    await expect(freshPage).toHaveURL("/");
    await freshContext.close();
});

test("sends a signed-out visitor to sign in", async ({ page }) => {
    await page.goto("/videos");

    await expect(page).toHaveURL(/\/sign-in/);
});

test("returns to the page asked for after signing in", async ({ page, browser }) => {
    const account = createTestAccount();
    await signUp(page, account);
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await useOwnClientAddress(freshPage);

    await openPage(freshPage, "/videos");
    await expect(freshPage).toHaveURL(/\/sign-in\?redirect=/);
    await freshPage.getByLabel("Email").fill(account.email);
    await freshPage.getByLabel("Senha", { exact: true }).fill(account.password);
    await freshPage.getByRole("button", { name: "Entrar" }).click();

    await expect(freshPage).toHaveURL("/videos");
    await freshContext.close();
});
