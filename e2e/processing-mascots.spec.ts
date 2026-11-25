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

function getMascot(section: Locator): Locator {
    return section.locator(".mascot-animation");
}

function countColumns(list: Locator): Promise<number> {
    return list.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
}

function measureBrandLift(brand: Locator): Promise<number> {
    return brand.evaluate(async (element) => {
        const floating = element.getAnimations().find((animation) => {
            return animation instanceof CSSAnimation && animation.animationName === "brand-float";
        });
        const duration = floating?.effect?.getTiming().duration;

        if (floating === undefined || typeof duration !== "number") {
            throw new Error("The brand mascot could not be replayed in slow motion");
        }

        floating.pause();
        await floating.ready;
        floating.playbackRate = 0.1;
        floating.currentTime = duration * 0.45;
        const peak = new DOMMatrixReadOnly(getComputedStyle(element).transform);

        floating.playbackRate = 1;
        floating.play();
        return peak.m42;
    });
}

test("the home mascot tracks the pointer, changes expression and blinks", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());

    const mascot = getMascot(page.getByRole("heading", { level: 1 }));
    const gaze = mascot.locator(".brand-gaze");
    const smile = gaze.locator(".brand-gaze-smile");
    const curious = gaze.locator(".brand-gaze-curious");
    const lids = gaze.locator(".brand-gaze-lids");
    const eyes = gaze.locator(".brand-gaze-eyes");
    const bounds = await mascot.boundingBox();

    if (bounds === null) {
        throw new Error("The home mascot is not visible");
    }

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const pointerDistance = 115;
    const horizontalTravel = (): Promise<number> =>
        eyes.evaluate((element) => Number.parseFloat(getComputedStyle(element).translate));

    await expect(gaze).toHaveCSS("visibility", "hidden");
    await page.bringToFront();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(gaze).toHaveCSS("visibility", "visible");
    await expect(smile).toHaveCSS("opacity", "1");

    await page.mouse.move(centerX + pointerDistance, centerY);
    await expect(curious).toHaveCSS("opacity", "1");
    await expect.poll(horizontalTravel).toBeGreaterThan(12);

    await page.mouse.move(centerX - pointerDistance, centerY);
    await expect.poll(horizontalTravel).toBeLessThan(-12);

    await mascot.hover({ force: true });
    await expect(smile).toHaveCSS("opacity", "1");
    await expect(curious).toHaveCSS("opacity", "0");
    await expect
        .poll(() => lids.evaluate((element) => getComputedStyle(element).animationName), {
            intervals: [35],
            timeout: 5000,
        })
        .toBe("brand-blink");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(gaze).toHaveCSS("visibility", "hidden");
    await expect(lids).toHaveCSS("animation-name", "none");
});

test("animates the processing crew and brand by default and saves the setting", async ({
    page,
}) => {
    const account = createTestAccount();
    const desktop = { width: 1680, height: 1000 };
    await page.setViewportSize(desktop);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await useOwnClientAddress(page);
    await signUp(page, account);
    const videoId = await seedDownloadingVideo(account.email);

    await page.bringToFront();
    await openPage(page, "/videos/" + videoId);

    const panel = page.getByRole("region", { name: "Processamento do vídeo" });
    const crew = panel.getByRole("list");
    const steps = crew.getByRole("listitem");
    const download = steps.filter({ hasText: "Download" });
    const transcription = steps.filter({ hasText: "Transcrição" });
    const brandLink = page.getByRole("link", { name: "Nelcota, ir para o início" });
    const brand = getMascot(brandLink);
    const cancel = panel.getByRole("button", { name: "Cancelar", exact: true });

    await expect(download).toHaveAttribute("aria-current", "step");
    await expect(steps).toHaveCount(4);
    await expect(getMascot(download)).toHaveCSS("animation-name", "crew-download");
    await expect(getMascot(download)).toHaveCSS("animation-iteration-count", "infinite");
    await expect(getMascot(download)).toHaveCSS("animation-play-state", "running");
    await expect(getMascot(download)).toHaveCSS("width", "80px");
    await expect(getMascot(transcription)).toHaveCSS("animation-name", "crew-idle");
    await expect(brand).toHaveCSS("animation-name", "brand-float");
    expect(await measureBrandLift(brand)).toBeLessThan(-3);
    await expect(panel.getByRole("button", { name: /animar|pausar mascotes/i })).toHaveCount(0);
    expect(await countColumns(crew)).toBe(4);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(getMascot(download)).toHaveCSS("animation-name", "mascot-opacity");
    await expect(getMascot(download)).toHaveCSS("animation-duration", "2.8s");
    await expect(getMascot(download)).toHaveCSS("transform", "none");
    await expect(brand).toHaveCSS("animation-name", "mascot-opacity");

    await page.setViewportSize({ width: 320, height: 760 });
    await expect(getMascot(download)).toHaveCSS("width", "56px");
    expect(await countColumns(crew)).toBe(2);
    expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
    );
    await cancel.scrollIntoViewIfNeeded();
    await expect(cancel).toBeInViewport();

    await page.setViewportSize(desktop);
    await openPage(page, "/account");
    const appearance = page.getByRole("region", { name: "Aparência" });
    const preference = appearance.getByRole("switch", { name: "Animações dos mascotes" });
    await expect(preference).toBeChecked();
    await preference.focus();
    await preference.press("Space");
    await expect(preference).not.toBeChecked();
    await expect(brand).toHaveCSS("animation-name", "none");

    await openPage(page, "/videos/" + videoId);
    await expect(getMascot(download)).toHaveCSS("animation-name", "none");
    await expect(getMascot(transcription)).toHaveCSS("animation-name", "none");
    await expect(brand).toHaveCSS("animation-name", "none");
    await cancel.hover();
    await expectNoAccessibilityViolations(page);

    await openPage(page, "/account");
    await expect(preference).not.toBeChecked();
    await preference.click();
    await expect(preference).toBeChecked();
    await expect(brand).toHaveCSS("animation-name", "mascot-opacity");
});

test("can turn off mascot animations when storage refuses writes", async ({ page }) => {
    await page.addInitScript(() => {
        const setItem: unknown = Object.getOwnPropertyDescriptor(
            Storage.prototype,
            "setItem",
        )?.value;

        if (typeof setItem !== "function") {
            throw new Error("Browser storage cannot be instrumented");
        }

        Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
            if (key === "nelcota:mascot-animations-disabled") {
                throw new DOMException("Storage quota exceeded", "QuotaExceededError");
            }

            Reflect.apply(setItem, this, [key, value]);
        };
    });
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
    await openPage(page, "/account");

    const preference = page.getByRole("switch", { name: "Animações dos mascotes" });
    const brand = getMascot(page.getByRole("link", { name: "Nelcota, ir para o início" }));
    await expect(preference).toBeChecked();
    await expect(brand).toHaveCSS("animation-name", "mascot-opacity");

    await preference.press("Space");
    await expect(preference).not.toBeChecked();
    await expect(brand).toHaveCSS("animation-name", "none");

    await preference.press("Space");
    await expect(preference).toBeChecked();
    await expect(brand).toHaveCSS("animation-name", "mascot-opacity");
});
