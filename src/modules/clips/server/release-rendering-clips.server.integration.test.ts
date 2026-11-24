import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import type { ClipStatus } from "#/modules/clips/model/clip-status";
import { releaseRenderingClips } from "#/modules/clips/server/release-rendering-clips.server";
import { videos } from "#/modules/video-records/video-records.schema";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 2;

async function insertFailedVideoWithClips(clipStatuses: Array<ClipStatus>): Promise<string> {
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
        status: "failed",
    });
    await db.insert(clips).values(
        clipStatuses.map((status, position) => ({
            videoId,
            position,
            title: "Test clip",
            reason: "Test reason",
            startSeconds: 0,
            endSeconds: 30,
            score: 80,
            status,
        })),
    );

    return videoId;
}

async function readClipStatuses(videoId: string): Promise<Array<ClipStatus>> {
    const rows = await db
        .select({ status: clips.status })
        .from(clips)
        .where(eq(clips.videoId, videoId))
        .orderBy(asc(clips.position));

    return rows.map((row) => row.status);
}

describe("releaseRenderingClips", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("fails the clips a stopped run left rendering", async () => {
        const videoId = await insertFailedVideoWithClips(["rendering", "done"]);

        await releaseRenderingClips(videoId, "failed");

        assert.deepEqual(await readClipStatuses(videoId), ["failed", "done"]);
    });

    test("sends them back to the queue on a cancel", async () => {
        const videoId = await insertFailedVideoWithClips(["rendering", "pending"]);

        await releaseRenderingClips(videoId, "pending");

        assert.deepEqual(await readClipStatuses(videoId), ["pending", "pending"]);
    });
});
