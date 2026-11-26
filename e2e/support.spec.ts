import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test("starts a conversation about an area and reads it back", async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
    await openPage(page, "/support");
    await expectNoAccessibilityViolations(page);

    await page.getByRole("main").getByRole("link", { name: "Cortes", exact: true }).click();
    await expect(page.getByText("Área: Cortes")).toBeVisible();
    await page.getByLabel("Assunto").fill("O vídeo travou em Baixando");
    await page.getByLabel("Mensagem").fill("Colei o link e ficou parado.");
    await expectNoAccessibilityViolations(page);
    await page.getByRole("button", { name: "Iniciar conversa" }).click();

    await expect(
        page.getByRole("heading", { level: 1, name: "O vídeo travou em Baixando" }),
    ).toBeVisible();
    await expect(page.getByText("Colei o link e ficou parado.")).toBeVisible();
    await expect(page.getByText("Aguardando suporte")).toBeVisible();
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
