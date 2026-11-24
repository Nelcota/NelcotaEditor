import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import type { StartVideoUploadInput } from "#/modules/videos/model/video-upload-input";
import { StorageQuotaExceededError } from "#/modules/videos/model/storage-quota-exceeded-error";
import {
    UploadNotFoundError,
    UploadedFileMissingError,
    confirmVideoUpload,
} from "#/modules/videos/server/confirm-video-upload.server";
import {
    discardPendingUpload,
    findOwnedPendingUpload,
    removeExpiredUploads,
} from "#/modules/videos/server/pending-uploads.server";
import {
    MAX_VIDEOS_IN_PROGRESS,
    TooManyVideosInProgressError,
} from "#/modules/videos/server/processing-limit.server";
import {
    UploadTooLargeError,
    reserveVideoUpload,
} from "#/modules/videos/server/reserve-video-upload.server";
import { storeVideoUpload } from "#/modules/videos/server/store-video-upload.server";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";
import { videoUploads } from "#/modules/videos/videos.schema";
import type { VideoUpload } from "#/modules/videos/videos.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Runs against the test database from .env.test: bun run test:integration

const SMALL_UPLOAD_BYTES = 16;
// Room for one upload of FITTING_UPLOAD_BYTES, not two.
const FREE_BYTES_LEFT = 3_000_000_000;
const FITTING_UPLOAD_BYTES = 2_000_000_000;

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

async function insertStoredVideo(userId: string, sourceBytes: number): Promise<void> {
    await db.insert(videos).values({
        id: randomUUID(),
        userId,
        title: "Saved video",
        source: "upload",
        sourcePath: "videos/saved/source.mp4",
        sourceBytes,
        requestedClipCount: 3,
        status: "done",
    });
}

function uploadInput(sizeBytes: number): StartVideoUploadInput {
    return {
        fileName: "gravação.mp4",
        title: "",
        sizeBytes,
        clipCount: 3,
        clipLength: "minute",
        language: "pt",
    };
}

function streamOfBytes(byteCount: number): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array(byteCount));
            controller.close();
        },
    });
}

async function sendFile(upload: VideoUpload, byteCount: number): Promise<void> {
    await storeVideoUpload(streamOfBytes(byteCount), {
        sourcePath: upload.sourcePath,
        maxBytes: byteCount,
    });
}

async function countReservations(uploadId: string): Promise<number> {
    const rows = await db.select().from(videoUploads).where(eq(videoUploads.id, uploadId));
    return rows.length;
}

describe("video uploads", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("refuses an upload that does not fit next to one already reserved", async () => {
        const userId = await createTestUser();
        await insertStoredVideo(userId, getStorageQuotaBytes() - FREE_BYTES_LEFT);
        await reserveVideoUpload(userId, uploadInput(FITTING_UPLOAD_BYTES));

        const second = reserveVideoUpload(userId, uploadInput(FITTING_UPLOAD_BYTES));

        await expect(second).rejects.toThrow(StorageQuotaExceededError);
    });

    it("refuses more reservations than processing slots", async () => {
        const userId = await createTestUser();

        for (let upload = 0; upload < MAX_VIDEOS_IN_PROGRESS; upload += 1) {
            await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        }

        const extra = reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));

        await expect(extra).rejects.toThrow(TooManyVideosInProgressError);
    });

    it("refuses a declared size above 5 GB", async () => {
        const userId = await createTestUser();

        const run = reserveVideoUpload(userId, uploadInput(5_000_000_001));

        await expect(run).rejects.toThrow(UploadTooLargeError);
    });

    it("turns a confirmed upload into a queued video with the stored size", async () => {
        const userId = await createTestUser();
        const upload = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(upload, SMALL_UPLOAD_BYTES);

        const videoId = await confirmVideoUpload(upload.id, userId);

        const [video] = await db.select().from(videos).where(eq(videos.id, videoId));
        expect(video?.status).toBe("queued");
        expect(video?.sourceBytes).toBe(SMALL_UPLOAD_BYTES);
        expect(video?.title).toBe("gravação");
        expect(await countReservations(upload.id)).toBe(0);
    });

    it("refuses to confirm before the file arrived and frees the reservation", async () => {
        const userId = await createTestUser();
        const upload = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));

        const run = confirmVideoUpload(upload.id, userId);

        await expect(run).rejects.toThrow(UploadedFileMissingError);
        expect(await countReservations(upload.id)).toBe(0);
    });

    it("answers another person's upload as missing", async () => {
        const ownerId = await createTestUser();
        const otherId = await createTestUser();
        const upload = await reserveVideoUpload(ownerId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(upload, SMALL_UPLOAD_BYTES);

        const run = confirmVideoUpload(upload.id, otherId);

        await expect(run).rejects.toThrow(UploadNotFoundError);
        expect(await countReservations(upload.id)).toBe(1);
    });

    it("refuses a stored file larger than declared and deletes it", async () => {
        const userId = await createTestUser();
        const upload = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(upload, SMALL_UPLOAD_BYTES * 2);

        const run = confirmVideoUpload(upload.id, userId);

        await expect(run).rejects.toThrow(UploadTooLargeError);
        expect(await getFileStorage().measureFile(upload.sourcePath)).toBe(0);
    });

    it("leaves the files of a confirmed upload alone when a late discard arrives", async () => {
        const userId = await createTestUser();
        const upload = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(upload, SMALL_UPLOAD_BYTES);
        await confirmVideoUpload(upload.id, userId);

        await discardPendingUpload(upload.id);

        expect(await getFileStorage().measureFile(upload.sourcePath)).toBe(SMALL_UPLOAD_BYTES);
    });

    it("sweeps expired uploads with their files and keeps the others", async () => {
        const userId = await createTestUser();
        const expired = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        const current = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(expired, SMALL_UPLOAD_BYTES);
        await db
            .update(videoUploads)
            .set({ expiresAt: new Date(Date.now() - 1000) })
            .where(eq(videoUploads.id, expired.id));

        await removeExpiredUploads();

        expect(await countReservations(expired.id)).toBe(0);
        expect(await getFileStorage().measureFile(expired.sourcePath)).toBe(0);
        expect(await countReservations(current.id)).toBe(1);
    });

    it("keeps an expired upload for the next sweep when its files cannot be deleted", async () => {
        const userId = await createTestUser();
        const expired = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(expired, SMALL_UPLOAD_BYTES);
        await db
            .update(videoUploads)
            .set({ expiresAt: new Date(Date.now() - 1000) })
            .where(eq(videoUploads.id, expired.id));
        vi.spyOn(getFileStorage(), "deleteFolder").mockRejectedValue(new Error("store down"));

        await expect(removeExpiredUploads()).rejects.toThrow("store down");

        expect(await countReservations(expired.id)).toBe(1);
    });

    it("frees the slot of a discarded upload and leaves it to the sweep when its files cannot be deleted", async () => {
        const userId = await createTestUser();
        const upload = await reserveVideoUpload(userId, uploadInput(SMALL_UPLOAD_BYTES));
        await sendFile(upload, SMALL_UPLOAD_BYTES);
        vi.spyOn(getFileStorage(), "deleteFolder").mockRejectedValue(new Error("store down"));

        await expect(discardPendingUpload(upload.id)).rejects.toThrow("store down");

        expect(await findOwnedPendingUpload(upload.id, userId)).toBeNull();
        expect(await countReservations(upload.id)).toBe(1);
    });
});
