import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { saveDownloadedSource } from "#/modules/processing/server/save-downloaded-source.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getEnvironment } from "#/shared/server/env.server";

// Runs against the test database from .env.test: bun run test:integration

const BYTES_PER_GIGABYTE = 1024 * 1024 * 1024;
const REQUESTED_CLIP_COUNT = 3;
const DURATION_SECONDS = 120;
const DOWNLOAD_SHARE_OF_QUOTA = 4;

function getQuotaBytes(): number {
    return Math.floor(getEnvironment().STORAGE_QUOTA_GIGABYTES * BYTES_PER_GIGABYTE);
}

/** A quarter of the quota, whatever the .env sets it to. */
function getDownloadBytes(): number {
    return Math.floor(getQuotaBytes() / DOWNLOAD_SHARE_OF_QUOTA);
}

// Plain SQL: the processing module does not depend on auth, which owns the user table.
async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.execute(
        sql`insert into "user" (id, name, email) values (${userId}, 'Test account', ${`${userId}@example.com`})`,
    );

    return userId;
}

async function insertVideo(userId: string, sourceBytes: number | null): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sourceBytes,
        requestedClipCount: REQUESTED_CLIP_COUNT,
        status: "downloading",
    });

    return videoId;
}

async function readSourceBytes(videoId: string): Promise<number | null | undefined> {
    const rows = await db
        .select({ sourceBytes: videos.sourceBytes })
        .from(videos)
        .where(eq(videos.id, videoId));

    return rows[0]?.sourceBytes;
}

describe("saveDownloadedSource", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("refuses a download that does not fit in the free space", async () => {
        const userId = await createTestUser();
        const downloadBytes = getDownloadBytes();
        await insertVideo(userId, getQuotaBytes() - Math.floor(downloadBytes / 2));
        const videoId = await insertVideo(userId, null);

        const save = saveDownloadedSource({
            videoId,
            userId,
            sourcePath: `videos/${videoId}/source.mp4`,
            sourceBytes: downloadBytes,
            durationSeconds: DURATION_SECONDS,
        });

        await assert.rejects(save, { name: "StorageQuotaExceededError" });
        assert.equal(await readSourceBytes(videoId), null);
    });

    test("saves a download that fits with its real size", async () => {
        const userId = await createTestUser();
        const videoId = await insertVideo(userId, null);
        const downloadBytes = getDownloadBytes();

        await saveDownloadedSource({
            videoId,
            userId,
            sourcePath: `videos/${videoId}/source.mp4`,
            sourceBytes: downloadBytes,
            durationSeconds: DURATION_SECONDS,
        });

        assert.equal(await readSourceBytes(videoId), downloadBytes);
    });

    test("leaves room for an upload that already reserved the remaining space", async () => {
        const userId = await createTestUser();
        const uploadId = randomUUID();
        const reservedBytes = 1_024;
        const downloadBytes = getDownloadBytes();
        await insertVideo(userId, getQuotaBytes() - downloadBytes);
        const videoId = await insertVideo(userId, null);
        await db.execute(
            sql`insert into video_uploads
                (id, user_id, source_path, declared_bytes, title, requested_clip_count, clip_length,
                 transcription_language, expires_at)
                values (${uploadId}, ${userId}, ${`videos/${uploadId}/source.mp4`}, ${reservedBytes},
                        'Test upload', 3, 'minute', '', now() + interval '1 hour')`,
        );

        const save = saveDownloadedSource({
            videoId,
            userId,
            sourcePath: `videos/${videoId}/source.mp4`,
            sourceBytes: downloadBytes,
            durationSeconds: DURATION_SECONDS,
        });

        await assert.rejects(save, { name: "StorageQuotaExceededError" });
        assert.equal(await readSourceBytes(videoId), null);
    });
});
