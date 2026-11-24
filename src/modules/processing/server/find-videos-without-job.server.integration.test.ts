import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { inArray, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { findVideosWithoutJob } from "#/modules/processing/server/find-videos-without-job.server";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { getJobQueue } from "#/shared/server/job-queue.server";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 1;
// Older than anything other tests leave behind, so the oldest-first limit always reaches it.
const LONG_AGO = new Date("2000-01-01T00:00:00Z");
const createdVideoIds: Array<string> = [];

// Plain SQL: the processing module does not depend on auth, which owns the user table.
async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.execute(
        sql`insert into "user" (id, name, email) values (${userId}, 'Test account', ${`${userId}@example.com`})`,
    );

    return userId;
}

async function insertVideo(
    status: VideoStatus,
    updatedAt: Date,
): Promise<{ videoId: string; userId: string }> {
    const userId = await createTestUser();
    const videoId = randomUUID();
    createdVideoIds.push(videoId);
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status,
        processingStartedAt: updatedAt,
        createdAt: updatedAt,
        updatedAt,
    });

    return { videoId, userId };
}

async function findStuckVideoIds(): Promise<Array<string>> {
    const stuckVideos = await findVideosWithoutJob();

    return stuckVideos.map((video) => video.id);
}

describe("findVideosWithoutJob", () => {
    afterAll(async () => {
        // Gone, so the oldest-first limit of a later run never meets these.
        await db.delete(videos).where(inArray(videos.id, createdVideoIds));
        const jobQueue = await getJobQueue();
        await jobQueue.stop({ graceful: false });
        await db.$client.end();
    });

    test("finds a working video that no job runs", async () => {
        const { videoId } = await insertVideo("transcribing", LONG_AGO);

        assert.ok((await findStuckVideoIds()).includes(videoId));
    });

    test("leaves a video that a job waits for", async () => {
        const { videoId, userId } = await insertVideo("queued", LONG_AGO);
        await enqueueVideoProcessing({ videoId, userId }, null);

        assert.equal((await findStuckVideoIds()).includes(videoId), false);
    });

    test("leaves a video updated within the grace period", async () => {
        const { videoId } = await insertVideo("downloading", new Date());

        assert.equal((await findStuckVideoIds()).includes(videoId), false);
    });

    test("leaves a finished video", async () => {
        const { videoId } = await insertVideo("failed", LONG_AGO);

        assert.equal((await findStuckVideoIds()).includes(videoId), false);
    });
});
