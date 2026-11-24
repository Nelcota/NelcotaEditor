import { randomUUID } from "node:crypto";
import path from "node:path";
import type { StartVideoUploadInput } from "#/modules/videos/model/video-upload-input";
import { summarizePendingUploads } from "#/modules/videos/server/pending-uploads.server";
import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { videoUploads } from "#/modules/videos/videos.schema";
import type { VideoUpload } from "#/modules/videos/videos.schema";
import {
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_TITLE_LENGTH,
    MAX_UPLOAD_BYTES,
} from "#/modules/video-records/model/upload-limits";
import { truncateText } from "#/modules/video-records/model/video-title";
import { getVideoDirectory } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const SOURCE_FILE_NAME = "source";
const UPLOAD_PLACEHOLDER_TITLE = "Vídeo enviado";
// Long enough for 5 GB on a slow connection; an abandoned upload holds its slot no longer.
const RESERVATION_MILLISECONDS = 6 * 60 * 60 * 1000;

export class UploadTooLargeError extends UserFacingError {
    constructor() {
        super("O arquivo passa do limite de 5 GB.");
        this.name = "UploadTooLargeError";
    }
}

export class UnsupportedVideoFormatError extends UserFacingError {
    constructor() {
        super("Formato não suportado. Use MP4, MOV, MKV, WEBM ou AVI.");
        this.name = "UnsupportedVideoFormatError";
    }
}

class UploadNotReservedError extends Error {
    constructor(uploadId: string) {
        super(`Insert of upload ${uploadId} returned no row`);
        this.name = "UploadNotReservedError";
    }
}

function resolveTitle(input: StartVideoUploadInput): string {
    if (input.title.length > 0) {
        return input.title;
    }

    const baseName = truncateText(path.parse(input.fileName).name.trim(), MAX_TITLE_LENGTH);

    if (baseName.length === 0) {
        return UPLOAD_PLACEHOLDER_TITLE;
    }

    return baseName;
}

function readExtension(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();

    if (ALLOWED_VIDEO_EXTENSIONS.includes(extension) === false) {
        throw new UnsupportedVideoFormatError();
    }

    return extension;
}

/**
 * Grants the upload its space and processing slot before a byte is sent. The row is the
 * reservation: parallel uploads of the same person see it, whichever server they reach.
 *
 * @throws {TooManyVideosInProgressError} When the person has no free processing slot.
 * @throws {StorageQuotaExceededError} When the declared size does not fit in the free space.
 */
export async function reserveVideoUpload(
    userId: string,
    input: StartVideoUploadInput,
): Promise<VideoUpload> {
    const sizeBytes = input.sizeBytes;

    if (sizeBytes > MAX_UPLOAD_BYTES) {
        throw new UploadTooLargeError();
    }

    const uploadId = randomUUID();
    const sourcePath = path.posix.join(
        getVideoDirectory(uploadId),
        `${SOURCE_FILE_NAME}${readExtension(input.fileName)}`,
    );

    return runVideoStartTransaction(userId, async ({ transaction }) => {
        const pending = await summarizePendingUploads(userId, transaction, null);
        await assertCanStartAnotherVideo(userId, transaction, pending.count);
        await assertStorageAvailable(
            { userId, incomingBytes: sizeBytes, reservedBytes: pending.bytes },
            transaction,
        );
        const rows = await transaction
            .insert(videoUploads)
            .values({
                id: uploadId,
                userId,
                sourcePath,
                declaredBytes: sizeBytes,
                title: resolveTitle(input),
                requestedClipCount: input.clipCount,
                clipLength: input.clipLength,
                transcriptionLanguage: input.language,
                expiresAt: new Date(Date.now() + RESERVATION_MILLISECONDS),
            })
            .returning();
        const upload = rows[0];

        if (upload === undefined) {
            throw new UploadNotReservedError(uploadId);
        }

        return upload;
    });
}
