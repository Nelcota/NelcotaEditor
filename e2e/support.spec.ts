import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test("opens a support ticket from the sidebar and reads it back", async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
    await openPage(page, "/support");
    await expectNoAccessibilityViolations(page);

    await page.getByRole("link", { name: "Abrir ticket" }).first().click();
    await page.getByLabel("Assunto").fill("O vídeo travou em Baixando");
    await page.getByLabel("Mensagem").fill("Colei o link e ficou parado.");
    await expectNoAccessibilityViolations(page);
    await page.getByRole("button", { name: "Enviar ticket" }).click();

    await expect(
        page.getByRole("heading", { level: 1, name: "O vídeo travou em Baixando" }),
    ).toBeVisible();
    await expect(page.getByText("Colei o link e ficou parado.")).toBeVisible();
    await expectNoAccessibilityViolations(page);
});

test("reaches the contact form from sign-in without an account", async ({ page }) => {
    await useOwnClientAddress(page);
    await openPage(page, "/sign-in");

    await page.getByRole("link", { name: "Fale com o suporte" }).click();
    await page.getByLabel("Seu email").fill("visitante@example.com");
    await page.getByLabel("Mensagem").fill("Não recebi o email de confirmação.");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page.getByText("Mensagem enviada. Respondemos no email informado.")).toBeVisible();
    await expectNoAccessibilityViolations(page);
});
