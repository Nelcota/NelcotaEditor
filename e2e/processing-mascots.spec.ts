import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { Client } from "pg";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

async function seedDownloadingVideo(email: string): Promise<string> {
    const databaseUrl = process.env.DATABASE_URL ?? "";

    if (databaseUrl.endsWith("/nelcota_test") === false) {
        throw new Error("Processing test fixtures must use the test database");
    }

    const videoId = randomUUID();
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    try {
        const result = await client.query(
            `insert into videos (id, user_id, title, source, requested_clip_count, status, progress_percent)
             select $1, id, 'Entrevista', 'upload', 3, 'downloading', 12 from "user" where email = $2`,
            [videoId, email],
        );

        if (result.rowCount !== 1) {
            throw new Error("The test account could not be assigned a video");
        }

        return videoId;
    } finally {
        await client.end();
    }
}

function countAnimations(step: Locator): Promise<number> {
    return step.evaluate((element) => element.getAnimations({ subtree: true }).length);
}

function readNextGesture(step: Locator): Promise<string> {
    return step.evaluate(
        (element) =>
            new Promise<string>((resolve, reject) => {
                const deadline = window.setTimeout(() => {
                    element.removeEventListener("animationstart", readGesture);
                    reject(new Error("The active mascot did not replay its gesture"));
                }, 6_000);

                function readGesture(event: Event): void {
                    window.clearTimeout(deadline);

                    if (event instanceof AnimationEvent) {
                        const gesture = element.getAnimations({ subtree: true }).at(0);

                        if (gesture !== undefined) {
                            gesture.playbackRate = 0.1;
                        }

                        resolve(event.animationName);
                    }
                }

                element.addEventListener("animationstart", readGesture, { once: true });
            }),
    );
}

test("replays the active mascot and respects pause and reduced motion", async ({ page }) => {
    const account = createTestAccount();
    await useOwnClientAddress(page);
    await signUp(page, account);
    const videoId = await seedDownloadingVideo(account.email);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.bringToFront();
    await openPage(page, `/videos/${videoId}`);

    const steps = page.getByRole("tabpanel", { name: "Cortes" }).getByRole("listitem");
    const download = steps.filter({ hasText: "Download" });
    const transcription = steps.filter({ hasText: "Transcrição" });
    const pause = page.getByRole("button", { name: "Pausar mascotes" });

    await expect(download).toHaveAttribute("aria-current", "step");
    await expect(pause).toBeVisible();
    await expect.poll(() => countAnimations(download)).toBe(0);
    expect(await readNextGesture(download)).toBe("crew-download");
    await expect.poll(() => countAnimations(transcription)).toBe(0);

    await pause.click();
    await expect.poll(() => countAnimations(download)).toBe(0);
    await expect(download).toHaveAttribute("aria-current", "step");

    await page.getByRole("button", { name: "Animar mascotes" }).click();
    await expect.poll(() => countAnimations(download)).toBe(1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPage(page, `/videos/${videoId}`);

    const play = page.getByRole("button", { name: "Animar mascotes" });
    await expect(play).toBeVisible();
    await expect(pause).toBeHidden();
    await expect.poll(() => countAnimations(download)).toBe(0);

    await play.click();
    await expect(pause).toBeVisible();
    await expect.poll(() => countAnimations(download)).toBe(1);
    await expect.poll(() => countAnimations(download)).toBe(0);
    expect(await readNextGesture(download)).toBe("crew-download");
    await expect.poll(() => countAnimations(transcription)).toBe(0);

    await pause.click();
    await expect(play).toBeVisible();
    await expect.poll(() => countAnimations(download)).toBe(0);
    await page.getByRole("button", { name: "Cancelar", exact: true }).hover();
    await expectNoAccessibilityViolations(page);
});
