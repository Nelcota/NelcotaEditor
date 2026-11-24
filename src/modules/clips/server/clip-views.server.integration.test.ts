import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { listReadyClipsSince } from "#/modules/clips/server/clip-views.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 1;

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

async function insertVideoWithReadyClip(userId: string, status: VideoStatus): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status,
    });
    await db.insert(clips).values({
        videoId,
        position: 0,
        title: "Test clip",
        reason: "Test reason",
        startSeconds: 0,
        endSeconds: 30,
        score: 80,
        status: "done",
    });

    return videoId;
}

describe("listReadyClipsSince", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("leaves out the ready clips of videos still in progress", async () => {
        const userId = await createTestUser();
        const finishedVideoId = await insertVideoWithReadyClip(userId, "done");
        await insertVideoWithReadyClip(userId, "rendering");

        const rows = await listReadyClipsSince(userId, new Date(0));

        assert.deepEqual(
            rows.map((row) => row.videoId),
            [finishedVideoId],
        );
    });
});
