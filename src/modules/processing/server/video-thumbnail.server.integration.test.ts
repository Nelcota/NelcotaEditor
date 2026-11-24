import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, test } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { ensureVideoThumbnail } from "#/modules/processing/server/video-thumbnail.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

// Runs against the test database from .env.test: bun run test:integration

const SOURCE_BYTES = 1_000_000;
const THUMBNAIL_BYTES = 2_048;
const DURATION_SECONDS = 120;

// Plain SQL: the processing module does not depend on auth, which owns the user table.
async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.execute(
        sql`insert into "user" (id, name, email) values (${userId}, 'Test account', ${`${userId}@example.com`})`,
    );

    return userId;
}

/** A video whose frame an earlier run already stored, so no ffmpeg is needed. */
async function insertVideoWithThumbnail(workDirectory: string): Promise<string> {
    const userId = await createTestUser();
    const videoId = randomUUID();
    const thumbnailPath = path.posix.join(getVideoDirectory(videoId), "thumbnail.jpg");
    const localThumbnailPath = path.join(workDirectory, "thumbnail.jpg");
    await writeFile(localThumbnailPath, new Uint8Array(THUMBNAIL_BYTES));
    await getFileStorage().storeLocalFile(thumbnailPath, localThumbnailPath);
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        sourcePath: path.posix.join(getVideoDirectory(videoId), "source.mp4"),
        sourceBytes: SOURCE_BYTES,
        thumbnailPath,
        requestedClipCount: 3,
        status: "transcribing",
    });

    return videoId;
}

async function readVideo(videoId: string): Promise<typeof videos.$inferSelect> {
    const rows = await db.select().from(videos).where(eq(videos.id, videoId));
    const video = rows[0];

    if (video === undefined) {
        throw new Error(`Test video ${videoId} is missing`);
    }

    return video;
}

describe("ensureVideoThumbnail", () => {
    const workDirectories: Array<string> = [];

    afterAll(async () => {
        await Promise.all(workDirectories.map((directory) => rm(directory, { recursive: true })));
        await db.$client.end();
    });

    test("counts the thumbnail in the stored source size", async () => {
        const workDirectory = await mkdtemp(path.join(tmpdir(), "thumbnail-test-"));
        workDirectories.push(workDirectory);
        const videoId = await insertVideoWithThumbnail(workDirectory);

        await ensureVideoThumbnail({
            video: await readVideo(videoId),
            localSourcePath: path.join(workDirectory, "source.mp4"),
            durationSeconds: DURATION_SECONDS,
            workDirectory,
            signal: new AbortController().signal,
        });

        assert.equal((await readVideo(videoId)).sourceBytes, SOURCE_BYTES + THUMBNAIL_BYTES);
        await getFileStorage().deleteFolder(getVideoDirectory(videoId));
    });
});
