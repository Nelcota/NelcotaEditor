import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { listReadyClipsSince } from "#/modules/clips/server/clip-views.server";
import { readStoredCaptionCues } from "#/modules/clips/server/read-stored-caption-cues.server";
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
        outputPath: `videos/${videoId}/clips/test.mp4`,
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

    test("rejects a ready clip without an output and captions with null cues", async () => {
        const userId = await createTestUser();
        const videoId = await insertVideoWithReadyClip(userId, "done");
        const forVideo = eq(clips.videoId, videoId);

        await expect(
            db.update(clips).set({ outputPath: null }).where(forVideo),
        ).rejects.toMatchObject({
            cause: { constraint: "clips_done_has_output" },
        });
        await expect(
            db
                .update(clips)
                .set({ captionCues: sql`'[null]'::jsonb` })
                .where(forVideo),
        ).rejects.toMatchObject({ cause: { constraint: "clips_caption_cues_array" } });
    });

    test("rejects invalid floating-point times at the database boundary", async () => {
        const userId = await createTestUser();
        const videoId = await insertVideoWithReadyClip(userId, "done");

        for (const seconds of [Number.NaN, Number.POSITIVE_INFINITY]) {
            await expect(
                db.update(videos).set({ durationSeconds: seconds }).where(eq(videos.id, videoId)),
            ).rejects.toMatchObject({ cause: { constraint: "videos_duration_seconds_finite" } });
            await expect(
                db.update(clips).set({ endSeconds: seconds }).where(eq(clips.videoId, videoId)),
            ).rejects.toMatchObject({ cause: { constraint: "clips_times_finite" } });
        }
    });

    test("falls back to the transcript when saved captions contain an invalid word", async () => {
        const userId = await createTestUser();
        const videoId = await insertVideoWithReadyClip(userId, "done");
        const [clip] = await db
            .update(clips)
            .set({
                captionCues: sql`'[{"startSeconds": 0, "endSeconds": 1, "words": [null]}]'::jsonb`,
            })
            .where(eq(clips.videoId, videoId))
            .returning({ id: clips.id, captionCues: clips.captionCues });

        assert.ok(clip);
        assert.equal(readStoredCaptionCues(clip), null);
    });
});
