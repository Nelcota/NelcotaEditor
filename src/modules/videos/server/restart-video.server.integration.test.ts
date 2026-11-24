import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import {
    MAX_VIDEOS_IN_PROGRESS,
    TooManyVideosInProgressError,
} from "#/modules/videos/server/processing-limit.server";
import { reserveVideoUpload } from "#/modules/videos/server/reserve-video-upload.server";
import { restartVideo } from "#/modules/videos/server/restart-video.server";
import { StorageQuotaExceededError } from "#/modules/videos/model/storage-quota-exceeded-error";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 3;
const RESERVED_UPLOAD_BYTES = 4_000_000_000;

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

interface TestVideo {
    userId: string;
    status: VideoStatus;
    sourceBytes: number | null;
}

async function insertVideo(video: TestVideo): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId: video.userId,
        title: "Test video",
        source: "upload",
        sourceBytes: video.sourceBytes,
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status: video.status,
    });

    return videoId;
}

async function readStatus(videoId: string): Promise<VideoStatus | undefined> {
    const rows = await db
        .select({ status: videos.status })
        .from(videos)
        .where(eq(videos.id, videoId));

    return rows[0]?.status;
}

async function reserveUpload(userId: string, sizeBytes: number): Promise<void> {
    await reserveVideoUpload(userId, {
        fileName: "gravação.mp4",
        title: "",
        sizeBytes,
        clipCount: REQUESTED_CLIP_COUNT,
        clipLength: "minute",
        language: "pt",
    });
}

describe("restartVideo", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("refuses to restart a video of an account that is already full", async () => {
        const userId = await createTestUser();
        await insertVideo({
            userId,
            status: "done",
            sourceBytes: Math.ceil(getStorageQuotaBytes()),
        });
        const failedVideoId = await insertVideo({ userId, status: "failed", sourceBytes: null });

        const restart = restartVideo({
            videoId: failedVideoId,
            userId,
            clipCondition: eq(clips.status, "failed"),
        });

        await assert.rejects(restart, StorageQuotaExceededError);
        assert.equal(await readStatus(failedVideoId), "failed");
    });

    test("counts a reserved upload against the processing limit", async () => {
        const userId = await createTestUser();

        for (let index = 0; index < MAX_VIDEOS_IN_PROGRESS - 1; index += 1) {
            await insertVideo({ userId, status: "transcribing", sourceBytes: null });
        }

        await reserveUpload(userId, RESERVED_UPLOAD_BYTES);
        const failedVideoId = await insertVideo({ userId, status: "failed", sourceBytes: null });

        const restart = restartVideo({
            videoId: failedVideoId,
            userId,
            clipCondition: eq(clips.status, "failed"),
        });

        await assert.rejects(restart, TooManyVideosInProgressError);
        assert.equal(await readStatus(failedVideoId), "failed");
    });

    test("counts the space a reserved upload holds against the quota", async () => {
        const userId = await createTestUser();
        await insertVideo({
            userId,
            status: "done",
            sourceBytes: Math.ceil(getStorageQuotaBytes()) - RESERVED_UPLOAD_BYTES,
        });
        await reserveUpload(userId, RESERVED_UPLOAD_BYTES);
        const failedVideoId = await insertVideo({ userId, status: "failed", sourceBytes: null });

        const restart = restartVideo({
            videoId: failedVideoId,
            userId,
            clipCondition: eq(clips.status, "failed"),
        });

        await assert.rejects(restart, StorageQuotaExceededError);
        assert.equal(await readStatus(failedVideoId), "failed");
    });
});
