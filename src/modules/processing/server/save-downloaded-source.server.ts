import { eq } from "drizzle-orm";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { videos } from "#/modules/video-records/video-records.schema";

interface DownloadedSource {
    videoId: string;
    userId: string;
    sourcePath: string;
    sourceBytes: number;
    durationSeconds: number;
}

/**
 * Saves a fresh YouTube download only if its real size fits in the owner's quota. The size is
 * unknown when the video is created, so this is the check that counts. It runs under the same lock
 * as uploads and retries, so none of them can fit into the same free space in between.
 *
 * @throws {StorageQuotaExceededError} When the file does not fit; nothing is saved then.
 */
export async function saveDownloadedSource(source: DownloadedSource): Promise<void> {
    const { videoId, userId, sourcePath, sourceBytes, durationSeconds } = source;

    if (Number.isSafeInteger(sourceBytes) === false || sourceBytes <= 0) {
        throw new RangeError(`Invalid size for the download of video ${videoId}: ${sourceBytes}`);
    }

    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new RangeError(
            `Invalid duration for the download of video ${videoId}: ${durationSeconds}`,
        );
    }

    await runVideoStartTransaction(userId, async ({ transaction }) => {
        await assertStorageAvailable({ userId, incomingBytes: sourceBytes }, transaction);
        await transaction
            .update(videos)
            .set({ sourcePath, sourceBytes, durationSeconds })
            .where(eq(videos.id, videoId));
    });
}
