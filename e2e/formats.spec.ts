import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

test("offers Claude connection before editing in Ranking or Tela dividida", async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
    await openPage(page, "/formats");
    await page.getByRole("button", { name: "Ranking" }).click();

    const ranking = page.getByRole("dialog", { name: "Ranking" });
    await expect(ranking.getByRole("link", { name: "Conectar o Claude" })).toBeVisible();
    await expect(ranking.getByRole("button", { name: "Escolher formato" })).toHaveCount(0);
    await expectNoAccessibilityViolations(page);
    await ranking.getByRole("button", { name: "Voltar" }).click();

    await page.getByRole("button", { name: "Tela dividida", exact: true }).click();
    const splitScreen = page.getByRole("dialog", { name: "Tela dividida" });
    await expect(splitScreen.getByRole("link", { name: "Conectar o Claude" })).toBeVisible();
});

const EXAMPLES = [
    { format: "Tela dividida", file: "split-screen-example" },
    { format: "Dinâmico gamificado", file: "dynamic-gamified-example" },
    { format: "Hacking", file: "hacking-example" },
] as const;

for (const { format, file } of EXAMPLES) {
    test(`plays the ${format} example with a Portuguese caption track`, async ({
        page,
        request,
    }) => {
        await useOwnClientAddress(page);
        await signUp(page, createTestAccount());
        await openPage(page, "/formats");
        await page.getByRole("button", { name: format, exact: true }).click();

        const dialog = page.getByRole("dialog", { name: format });
        const video = dialog.getByLabel(`Exemplo de vídeo no formato ${format}`);
        const examplePath = `/viral-formats/${file}`;
        const captionsPath = `${examplePath}.vtt`;

        await expect(video).toHaveAttribute("poster", `${examplePath}-poster.webp`);
        await expect(video).toHaveAttribute("src", `${examplePath}.mp4`);
        await expect(video.locator("track")).toHaveAttribute("src", captionsPath);
        const captions = await request.get(captionsPath);
        await expect(captions).toBeOK();
        expect(await captions.text()).toMatch(/^WEBVTT/);
        await expectNoAccessibilityViolations(page);

        await video.evaluate(
            async (element: HTMLVideoElement): Promise<void> => await element.play(),
        );
        await expect
            .poll(
                async () =>
                    await video.evaluate(
                        (element: HTMLVideoElement): number => element.currentTime,
                    ),
            )
            .toBeGreaterThan(0);
    });
}
