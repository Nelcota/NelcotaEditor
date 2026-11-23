import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { restartVideo } from "#/modules/videos/server/restart-video.server";
import { StorageQuotaExceededError } from "#/modules/videos/storage-quota-exceeded-error";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";
import { videos } from "#/modules/video-records/videos.schema";
import type { VideoStatus } from "#/modules/video-records/video-status";

// Needs a disposable database with the migrations applied (DATABASE_URL in .env); it is not part
// of `npm run check`. Run: npx tsx --test --test-force-exit src/modules/videos/server/restart-video.server.integration.ts

const REQUESTED_CLIP_COUNT = 3;

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

describe("restartVideo", () => {
    after(async () => {
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
});
