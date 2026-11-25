import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { createTestAccount, signUp, useOwnClientAddress } from "./support/accounts";

const CLIP_TITLE = "Corte panorâmico";
const SHARE_TOKEN_BYTES = 24;

interface SharedClipFixture {
    videoId: string;
    sharePath: string;
}

async function seedSharedClip(email: string): Promise<SharedClipFixture> {
    const databaseUrl = process.env.DATABASE_URL ?? "";

    if (new URL(databaseUrl).pathname !== "/nelcota_test") {
        throw new Error("Shared clip fixtures must use the test database");
    }

    const videoId = randomUUID();
    const shareToken = randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    try {
        const result = await client.query(
            `with source_video as (
                insert into videos (id, user_id, title, source, requested_clip_count, status, progress_percent)
                select $1, id, 'Entrevista', 'upload', 1, 'done', 100 from "user" where email = $2
                returning id
            )
            insert into clips (video_id, position, title, reason, start_seconds, end_seconds, score,
                               status, output_path, aspect_ratio, share_token)
            select id, 1, $3, 'Test reason', 0, 30, 80, 'done', $4, 'horizontal', $5 from source_video`,
            [videoId, email, CLIP_TITLE, `videos/${videoId}/clips/shared.mp4`, shareToken],
        );

        if (result.rowCount !== 1) {
            throw new Error("Could not create a shared clip for the test account");
        }

        return { videoId, sharePath: `/c/${shareToken}` };
    } finally {
        await client.end();
    }
}

test("copies a public clip link on a reload and respects its aspect ratio and revocation", async ({
    page,
    browser,
}) => {
    const account = createTestAccount();
    await useOwnClientAddress(page);
    await signUp(page, account);
    const { videoId, sharePath } = await seedSharedClip(account.email);
    const origin = new URL(page.url()).origin;
    const shareUrl = new URL(sharePath, origin).href;
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin });

    const ownerResponse = await page.goto(`/videos/${videoId}?tab=clips`, {
        waitUntil: "networkidle",
    });
    expect(ownerResponse?.status()).toBe(200);
    expect(await ownerResponse?.text()).toContain("Copiar link");
    await page.getByRole("button", { name: "Copiar link" }).click();
    await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shareUrl);

    const visitor = await browser.newContext();

    try {
        const publicPage = await visitor.newPage();
        const publicResponse = await publicPage.goto(shareUrl);
        expect(publicResponse?.status()).toBe(200);
        await expect(publicPage.getByRole("heading", { name: CLIP_TITLE })).toBeVisible();
        await expect(publicPage.locator('meta[name="robots"]')).toHaveAttribute(
            "content",
            "noindex",
        );
        const player = publicPage.getByRole("region", { name: `Corte: ${CLIP_TITLE}` });
        await expect(player).toHaveCSS("aspect-ratio", "16 / 9");

        await page.getByRole("button", { name: "Desativar link" }).click();
        await expect(page.getByRole("button", { name: "Criar link" })).toBeVisible();
        const revoked = await publicPage.reload();
        expect(revoked?.status()).toBe(404);
    } finally {
        await visitor.close();
    }
});
