import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import {
    markVideoDone,
    resetVideoToQueued,
} from "#/modules/video-records/server/video-progress.server";
import { videos } from "#/modules/video-records/video-records.schema";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 1;
const TEN_DAYS_IN_MILLISECONDS = 10 * 24 * 60 * 60 * 1000;

async function insertRenderingVideo(createdAt: Date, processingStartedAt: Date): Promise<string> {
    const userId = randomUUID();
    const videoId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Test account",
        email: `${userId}@example.com`,
        emailVerified: false,
    });
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status: "rendering",
        createdAt,
        processingStartedAt,
    });

    return videoId;
}

async function readFirstFinishedAt(videoId: string): Promise<Date | null | undefined> {
    const rows = await db
        .select({ firstFinishedAt: videos.firstFinishedAt })
        .from(videos)
        .where(eq(videos.id, videoId));

    return rows[0]?.firstFinishedAt;
}

describe("markVideoDone", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("records the first finish and keeps it through a later render", async () => {
        const now = new Date();
        const videoId = await insertRenderingVideo(now, now);
        await markVideoDone(videoId);
        const firstFinishedAt = await readFirstFinishedAt(videoId);
        await resetVideoToQueued(videoId);
        await db.update(videos).set({ status: "rendering" }).where(eq(videos.id, videoId));

        await markVideoDone(videoId);

        assert.ok(firstFinishedAt instanceof Date);
        assert.deepEqual(await readFirstFinishedAt(videoId), firstFinishedAt);
    });

    test("leaves out a run that did not start with the video", async () => {
        const now = new Date();
        const createdAt = new Date(now.getTime() - TEN_DAYS_IN_MILLISECONDS);
        const videoId = await insertRenderingVideo(createdAt, now);

        await markVideoDone(videoId);

        assert.equal(await readFirstFinishedAt(videoId), null);
    });
});
