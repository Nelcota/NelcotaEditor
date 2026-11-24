import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import type { LibraryClipCursor } from "#/modules/videos/model/library-clips-page";
import { listLibraryClipsPage } from "#/modules/videos/server/library-clips.server";
import { videos } from "#/modules/video-records/video-records.schema";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 5;

async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Test account",
        email: `${userId}@example.com`,
        emailVerified: false,
    });

    return userId;
}

async function insertVideoWithClips(
    userId: string,
    clipTitles: Array<{ title: string; score: number }>,
): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Vídeo de teste",
        source: "upload",
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status: "done",
    });
    await db.insert(clips).values(
        clipTitles.map((clip, position) => ({
            videoId,
            position,
            title: clip.title,
            reason: "Test reason",
            startSeconds: 0,
            endSeconds: 30,
            score: clip.score,
            status: "done" as const,
        })),
    );

    return videoId;
}

describe("listLibraryClipsPage", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("lists only the signed-in user's clips", async () => {
        const userId = await createTestUser();
        const otherUserId = await createTestUser();
        await insertVideoWithClips(userId, [{ title: "Meu corte", score: 50 }]);
        await insertVideoWithClips(otherUserId, [{ title: "Corte alheio", score: 50 }]);

        const page = await listLibraryClipsPage(userId, {
            query: "",
            order: "newest",
            cursor: null,
            limit: 10,
        });

        assert.deepEqual(
            page.items.map((item) => item.clip.title),
            ["Meu corte"],
        );
        assert.equal(page.totalCount, 1);
    });

    test("searches without case or accents", async () => {
        const userId = await createTestUser();
        await insertVideoWithClips(userId, [
            { title: "Edição rápida", score: 50 },
            { title: "Outro assunto", score: 50 },
        ]);

        const page = await listLibraryClipsPage(userId, {
            query: "EDICAO",
            order: "newest",
            cursor: null,
            limit: 10,
        });

        assert.deepEqual(
            page.items.map((item) => item.clip.title),
            ["Edição rápida"],
        );
    });

    test("pages through tied scores without repeating or skipping a clip", async () => {
        const userId = await createTestUser();
        await insertVideoWithClips(userId, [
            { title: "A", score: 70 },
            { title: "B", score: 90 },
            { title: "C", score: 70 },
            { title: "D", score: 70 },
            { title: "E", score: 10 },
        ]);
        const titles: Array<string> = [];
        let cursor: LibraryClipCursor | null = null;

        for (let pageNumber = 0; pageNumber < 5; pageNumber += 1) {
            const page = await listLibraryClipsPage(userId, {
                query: "",
                order: "best",
                cursor,
                limit: 2,
            });
            titles.push(...page.items.map((item) => item.clip.title));
            cursor = page.nextCursor;

            if (cursor === null) {
                break;
            }
        }

        assert.deepEqual(titles, ["B", "A", "C", "D", "E"]);
    });
});
