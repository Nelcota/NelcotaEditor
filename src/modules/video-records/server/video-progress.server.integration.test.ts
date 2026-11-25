import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { requestVideoCancellation } from "#/modules/video-records/server/stop-video.server";
import {
    markVideoCancelled,
    markVideoDone,
    markVideoFailed,
    resetVideoToQueued,
    shouldStopVideoRun,
    toVideoRun,
    updateVideoStage,
} from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 1;
const TEN_DAYS_IN_MILLISECONDS = 10 * 24 * 60 * 60 * 1000;
const ONE_SECOND_IN_MILLISECONDS = 1000;

interface TestVideo {
    status: VideoStatus;
    createdAt: Date;
    processingStartedAt: Date;
    hasUnrecordedFirstFinish?: boolean;
}

async function insertVideo(testVideo: TestVideo): Promise<VideoRun> {
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
        ...testVideo,
    });

    return { videoId, processingStartedAt: testVideo.processingStartedAt };
}

function insertRenderingVideo(createdAt: Date, processingStartedAt: Date): Promise<VideoRun> {
    return insertVideo({ status: "rendering", createdAt, processingStartedAt });
}

/** Started a second ago, so a retry in the same test always starts a run of its own. */
function insertQueuedVideo(): Promise<VideoRun> {
    const startedAt = new Date(Date.now() - ONE_SECOND_IN_MILLISECONDS);

    return insertVideo({ status: "queued", createdAt: startedAt, processingStartedAt: startedAt });
}

async function readVideo(videoId: string): Promise<Video> {
    const rows = await db.select().from(videos).where(eq(videos.id, videoId));
    const video = rows[0];

    if (video === undefined) {
        throw new Error(`Test video ${videoId} is missing`);
    }

    return video;
}

afterAll(async () => {
    await db.$client.end();
});

describe("markVideoDone", () => {
    test("records the first finish and keeps it through a later render", async () => {
        const now = new Date();
        const run = await insertRenderingVideo(now, now);
        await markVideoDone(run);
        const firstFinishedAt = (await readVideo(run.videoId)).firstFinishedAt;
        await resetVideoToQueued(run.videoId);
        await db.update(videos).set({ status: "rendering" }).where(eq(videos.id, run.videoId));
        const laterRun = toVideoRun(await readVideo(run.videoId));

        await markVideoDone(laterRun);

        assert.ok(firstFinishedAt instanceof Date);
        assert.deepEqual((await readVideo(run.videoId)).firstFinishedAt, firstFinishedAt);
    });

    test("records the first successful finish after a failed first run", async () => {
        const now = new Date();
        const createdAt = new Date(now.getTime() - TEN_DAYS_IN_MILLISECONDS);
        const firstRun = await insertRenderingVideo(createdAt, createdAt);

        assert.equal(await markVideoFailed(firstRun, "Test failure"), true);
        assert.ok(await resetVideoToQueued(firstRun.videoId));
        const queued = await readVideo(firstRun.videoId);
        assert.equal(await markVideoDone(toVideoRun(queued)), true);

        const finished = await readVideo(firstRun.videoId);
        assert.ok(finished.firstFinishedAt instanceof Date);
        assert.deepEqual(finished.firstFinishedAt, finished.finishedAt);
    });

    test("leaves a migrated first finish unknown after a new render", async () => {
        const now = new Date();
        const run = await insertVideo({
            status: "done",
            createdAt: now,
            processingStartedAt: now,
            hasUnrecordedFirstFinish: true,
        });
        assert.ok(await resetVideoToQueued(run.videoId));
        const queued = await readVideo(run.videoId);
        assert.equal(await markVideoDone(toVideoRun(queued)), true);

        assert.equal((await readVideo(run.videoId)).firstFinishedAt, null);
    });

    test("leaves a video that a newer run took", async () => {
        const run = await insertQueuedVideo();
        await requestVideoCancellation(run.videoId);
        await resetVideoToQueued(run.videoId);

        const isDone = await markVideoDone(run);

        assert.equal(isDone, false);
        assert.equal((await readVideo(run.videoId)).status, "queued");
    });
});

describe("markVideoCancelled", () => {
    test("records a cancel the user asked of the running run", async () => {
        const run = await insertRenderingVideo(new Date(), new Date());
        await requestVideoCancellation(run.videoId);

        await markVideoCancelled(run);

        assert.equal((await readVideo(run.videoId)).status, "cancelled");
    });

    test("leaves a video nobody asked to cancel", async () => {
        const run = await insertRenderingVideo(new Date(), new Date());

        await markVideoCancelled(run);

        assert.equal((await readVideo(run.videoId)).status, "rendering");
    });

    test("leaves a video retried after a cancel of the queued run", async () => {
        const run = await insertQueuedVideo();
        await requestVideoCancellation(run.videoId);
        await resetVideoToQueued(run.videoId);
        // The newer run is cancelled too, so only the run check keeps the stale run from writing.
        await db.update(videos).set({ cancelRequested: true }).where(eq(videos.id, run.videoId));

        await markVideoCancelled(run);

        assert.equal((await readVideo(run.videoId)).status, "queued");
    });
});

describe("markVideoFailed", () => {
    test("preserves cancellation requested just before a stage fails", async () => {
        const run = await insertRenderingVideo(new Date(), new Date());
        await requestVideoCancellation(run.videoId);

        const isFailed = await markVideoFailed(run, "Falhou");
        const video = await readVideo(run.videoId);

        assert.equal(isFailed, false);
        assert.equal(video.cancelRequested, true);
        assert.equal(video.errorMessage, null);
    });

    test("leaves a video that a newer run took", async () => {
        const run = await insertQueuedVideo();
        await requestVideoCancellation(run.videoId);
        await resetVideoToQueued(run.videoId);

        await markVideoFailed(run, "Falhou");

        assert.equal((await readVideo(run.videoId)).status, "queued");
    });
});

describe("updateVideoStage", () => {
    test("moves the video of the current run", async () => {
        const run = await insertQueuedVideo();

        await updateVideoStage(run, "transcribing", 40);

        const video = await readVideo(run.videoId);
        assert.equal(video.status, "transcribing");
        assert.equal(video.progressPercent, 40);
    });

    test("leaves a video that a newer run took", async () => {
        const run = await insertQueuedVideo();
        await requestVideoCancellation(run.videoId);
        await resetVideoToQueued(run.videoId);

        await updateVideoStage(run, "transcribing", 40);

        const video = await readVideo(run.videoId);
        assert.equal(video.status, "queued");
        assert.equal(video.progressPercent, 0);
    });
});

describe("shouldStopVideoRun", () => {
    test("keeps the current run going", async () => {
        const run = await insertRenderingVideo(new Date(), new Date());

        assert.equal(await shouldStopVideoRun(run), false);
    });

    test("stops a run once the video was retried", async () => {
        const run = await insertQueuedVideo();
        await requestVideoCancellation(run.videoId);
        await resetVideoToQueued(run.videoId);

        assert.equal(await shouldStopVideoRun(run), true);
    });

    test("stops a run of a deleted video", async () => {
        const run = await insertRenderingVideo(new Date(), new Date());
        await db.delete(videos).where(eq(videos.id, run.videoId));

        assert.equal(await shouldStopVideoRun(run), true);
    });
});
