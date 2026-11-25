import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test.beforeEach(async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
});

test("shows a first-time library and opens the new video dialog", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await openPage(page, "/videos");
    const crew = page.getByRole("list", { name: "Etapas do processamento" });
    await expect(crew.getByRole("listitem")).toHaveText([
        /Faísca.*baixa o vídeo/,
        /Tinta.*transcreve a fala/,
        /Brilho.*escolhe os momentos/,
        /Brasa.*faz os cortes/,
    ]);
    expect(await crew.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expectNoAccessibilityViolations(page);

    await page.getByRole("link", { name: "Enviar o primeiro vídeo" }).click();

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

test("uploads a file and opens the new video's page", async ({ page }) => {
    await openPage(page, "/videos");
    await page.getByRole("link", { name: "Enviar o primeiro vídeo" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel(/escolha no computador/).setInputFiles({
        name: "entrevista.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.alloc(2048),
    });

    const sendButton = dialog.getByRole("button", { name: "Gerar cortes" });
    const continueButton = dialog.getByRole("button", { name: "Continuar" });

    while ((await sendButton.isVisible()) === false) {
        await continueButton.click();
    }

    await sendButton.click();

    await expect(page).toHaveURL(/\/videos\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: "entrevista" })).toBeVisible();
});
