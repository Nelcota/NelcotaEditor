import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { VideoWithoutJob } from "#/modules/processing/server/find-videos-without-job.server";
import { resumeStuckVideos } from "#/modules/processing/server/stuck-video-recovery.server";
import {
    PROCESS_VIDEO_QUEUE,
    ensureProcessVideoQueue,
} from "#/modules/processing/server/video-processing-queue.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
import { getJobQueue } from "#/shared/server/job-queue.server";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 1;
const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const ONE_DAY_IN_MILLISECONDS = 24 * ONE_HOUR_IN_MILLISECONDS;
const createdVideoIds: Array<string> = [];

// Plain SQL: the processing module does not depend on auth, which owns the user table.
async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.execute(
        sql`insert into "user" (id, name, email) values (${userId}, 'Test account', ${`${userId}@example.com`})`,
    );

    return userId;
}

/** A video whose run started an hour ago and whose job died while it was transcribing. */
async function insertStuckVideo(): Promise<VideoWithoutJob> {
    const userId = await createTestUser();
    const videoId = randomUUID();
    const startedAt = new Date(Date.now() - ONE_HOUR_IN_MILLISECONDS);
    createdVideoIds.push(videoId);
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status: "transcribing",
        processingStartedAt: startedAt,
        createdAt: startedAt,
        updatedAt: startedAt,
    });

    return { id: videoId, userId, cancelRequested: false, processingStartedAt: startedAt };
}

/** Written straight to pg-boss's table: a job only fails through a dead worker or its heartbeat. */
async function insertFailedJobs(videoId: string, count: number, createdOn: Date): Promise<void> {
    await ensureProcessVideoQueue();

    for (let index = 0; index < count; index += 1) {
        await db.execute(
            sql`insert into pgboss.job (name, state, singleton_key, created_on) values (${PROCESS_VIDEO_QUEUE}, 'failed', ${videoId}, ${createdOn.toISOString()}::timestamptz)`,
        );
    }
}

async function countQueuedJobs(videoId: string): Promise<number> {
    const result = await db.execute(
        sql`select 1 from pgboss.job where name = ${PROCESS_VIDEO_QUEUE} and singleton_key = ${videoId} and state = 'created'`,
    );

    return result.rows.length;
}

async function readVideo(videoId: string): Promise<Video> {
    const rows = await db.select().from(videos).where(eq(videos.id, videoId));
    const video = rows[0];

    if (video === undefined) {
        throw new Error(`Test video ${videoId} is missing`);
    }

    return video;
}

describe("resumeStuckVideos", () => {
    afterAll(async () => {
        await db.delete(videos).where(inArray(videos.id, createdVideoIds));
        await db.execute(
            sql`delete from pgboss.job where name = ${PROCESS_VIDEO_QUEUE} and singleton_key in (${sql.join(createdVideoIds, sql`, `)})`,
        );
        const jobQueue = await getJobQueue();
        await jobQueue.stop({ graceful: false });
        await db.$client.end();
    });

    test("fails a video whose run already lost three jobs", async () => {
        const video = await insertStuckVideo();
        await insertFailedJobs(video.id, 3, new Date());

        await resumeStuckVideos([video]);

        const storedVideo = await readVideo(video.id);
        assert.equal(storedVideo.status, "failed");
        assert.notEqual(storedVideo.errorMessage, null);
        assert.equal(await countQueuedJobs(video.id), 0);
    });

    test("queues again a video whose run lost two jobs", async () => {
        const video = await insertStuckVideo();
        await insertFailedJobs(video.id, 2, new Date());

        await resumeStuckVideos([video]);

        assert.equal((await readVideo(video.id)).status, "transcribing");
        assert.equal(await countQueuedJobs(video.id), 1);
    });

    test("queues again a video whose lost jobs belong to an earlier run", async () => {
        const video = await insertStuckVideo();
        await insertFailedJobs(video.id, 3, new Date(Date.now() - ONE_DAY_IN_MILLISECONDS));

        await resumeStuckVideos([video]);

        assert.equal((await readVideo(video.id)).status, "transcribing");
        assert.equal(await countQueuedJobs(video.id), 1);
    });
});
