import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import {
    discardPendingUpload,
    findOwnedPendingUpload,
    summarizePendingUploads,
} from "#/modules/videos/server/pending-uploads.server";
import { assertCanStartVideoFor } from "#/modules/videos/server/processing-limit.server";
import { UploadTooLargeError } from "#/modules/videos/server/reserve-video-upload.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { videoUploads } from "#/modules/videos/videos.schema";
import type { VideoUpload } from "#/modules/videos/videos.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

export class UploadNotFoundError extends UserFacingError {
    constructor() {
        super("Este envio expirou. Envie o vídeo de novo.");
        this.name = "UploadNotFoundError";
    }
}

export class UploadedFileMissingError extends UserFacingError {
    constructor() {
        super("O arquivo não chegou por completo. Envie o vídeo de novo.");
        this.name = "UploadedFileMissingError";
    }
}

/**
 * Claims the reservation and creates the video with its job, all under the user's start lock.
 * The limits run again with the real size; the reservation itself no longer counts.
 */
async function createVideoFromUpload(upload: VideoUpload, sourceBytes: number): Promise<void> {
    const userId = upload.userId;

    if (userId === null) {
        throw new UploadNotFoundError();
    }

    await runVideoStartTransaction(userId, async ({ transaction, jobDatabase }) => {
        const pending = await summarizePendingUploads(userId, transaction, upload.id);
        await assertCanStartVideoFor({ userId, purpose: upload.purpose, pending }, transaction);
        await assertStorageAvailable(
            { userId, incomingBytes: sourceBytes, reservedBytes: pending.bytes },
            transaction,
        );
        // Deleting the row is the claim: a sweep or a second confirmation finds nothing after it.
        const claimed = await transaction
            .delete(videoUploads)
            .where(
                and(
                    eq(videoUploads.id, upload.id),
                    gt(videoUploads.expiresAt, sql`now()`),
                    isNull(videoUploads.cancelledAt),
                ),
            )
            .returning({ id: videoUploads.id });

        if (claimed.length === 0) {
            throw new UploadNotFoundError();
        }

        const processingStartedAt = new Date();
        await transaction.insert(videos).values({
            id: upload.id,
            userId,
            title: upload.title,
            source: "upload",
            purpose: upload.purpose,
            sourcePath: upload.sourcePath,
            sourceBytes,
            requestedClipCount: upload.requestedClipCount,
            clipLength: upload.clipLength,
            transcriptionLanguage: upload.transcriptionLanguage,
            processingStartedAt,
        });
        await enqueueVideoProcessing(
            { videoId: upload.id, userId, processingStartedAt },
            jobDatabase,
        );
    });
}

/** The size the store holds, which is what counts: the declared one came from the browser. */
async function measureUploadedFile(upload: VideoUpload): Promise<number> {
    const sourceBytes = await getFileStorage().measureFile(upload.sourcePath);

    if (sourceBytes === 0) {
        throw new UploadedFileMissingError();
    }

    if (sourceBytes > upload.declaredBytes) {
        throw new UploadTooLargeError();
    }

    return sourceBytes;
}

/**
 * Turns a finished upload into a video and queues it. Any refusal frees the reservation and the
 * file, since no row would ever point at them.
 *
 * @returns The new video's id.
 */
export async function confirmVideoUpload(uploadId: string, userId: string): Promise<string> {
    const upload = await findOwnedPendingUpload(uploadId, userId);

    if (upload === null) {
        throw new UploadNotFoundError();
    }

    try {
        const sourceBytes = await measureUploadedFile(upload);
        await createVideoFromUpload(upload, sourceBytes);
    } catch (error) {
        await discardPendingUpload(upload.id);
        throw error;
    }

    return upload.id;
}
