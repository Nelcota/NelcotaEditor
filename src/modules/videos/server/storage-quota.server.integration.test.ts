import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, test, vi } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { backfillStoredBytes } from "#/modules/processing/server/backfill-stored-bytes.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { measureUserStorage } from "#/modules/videos/server/usage-summary.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const ORIGINAL_BYTES = 100;
const THUMBNAIL_BYTES = 10;
const CLIP_BYTES = 50;
const POSTER_BYTES = 5;

afterAll(async () => {
    await db.$client.end();
});

test("keeps storage unknown until a failed measurement can be retried", async () => {
    const userId = randomUUID();
    const videoId = randomUUID();
    const sourcePath = `videos/${videoId}/source.mp4`;
    const thumbnailPath = `videos/${videoId}/thumbnail.jpg`;
    const outputPath = `videos/${videoId}/clips/clip.mp4`;
    const posterPath = `videos/${videoId}/clips/clip.jpg`;
    const measuredFiles = new Map([
        [sourcePath, ORIGINAL_BYTES],
        [thumbnailPath, THUMBNAIL_BYTES],
        [outputPath, CLIP_BYTES],
        [posterPath, POSTER_BYTES],
    ]);
    const storage = getFileStorage();
    const measureFile = storage.measureFile;
    let isSourceAvailable = false;
    const measurement = vi.spyOn(storage, "measureFile").mockImplementation(async (key) => {
        if (key === sourcePath && isSourceAvailable === false) {
            throw new Error("Temporary storage failure");
        }

        return measuredFiles.get(key) ?? (await measureFile(key));
    });

    try {
        await db
            .insert(user)
            .values({ id: userId, name: "Test account", email: `${userId}@example.test` });
        await db.insert(videos).values({
            id: videoId,
            userId,
            title: "Test video",
            source: "upload",
            requestedClipCount: 1,
            sourcePath,
            thumbnailPath,
        });
        await db.insert(clips).values({
            videoId,
            position: 0,
            title: "Test clip",
            reason: "Test reason",
            startSeconds: 0,
            endSeconds: 20,
            score: 80,
            status: "done",
            outputPath,
            posterPath,
        });

        await backfillStoredBytes();
        const pending = await measureUserStorage(userId, db);
        assert.equal(pending.totalBytes, null);
        assert.equal(pending.sourceBytes, null);
        assert.equal(pending.clipBytes, CLIP_BYTES + POSTER_BYTES);
        await assert.rejects(
            assertStorageAvailable({ userId, incomingBytes: 1 }, db),
            UserFacingError,
        );

        isSourceAvailable = true;
        await backfillStoredBytes();
        const measured = await measureUserStorage(userId, db);
        assert.deepEqual(measured, {
            totalBytes: ORIGINAL_BYTES + THUMBNAIL_BYTES + CLIP_BYTES + POSTER_BYTES,
            clipBytes: CLIP_BYTES + POSTER_BYTES,
            sourceBytes: ORIGINAL_BYTES + THUMBNAIL_BYTES,
        });
        await assertStorageAvailable({ userId, incomingBytes: 1 }, db);
    } finally {
        measurement.mockRestore();
        await db.delete(user).where(eq(user.id, userId));
    }
});
