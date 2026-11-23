import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { uploadReservations } from "#/modules/videos/server/upload-reservations.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";

interface UploadSpaceRequest {
    userId: string;
    /** The Content-Length the upload declared; the stream is cut there. */
    declaredBytes: number;
}

/**
 * Holds room for an upload before its first byte is written: the uploads of the same person that
 * are still writing count against the in-progress limit and the quota, so parallel uploads cannot
 * fill the disk. Returns the release, which the caller runs once the upload has its row or failed.
 * The checks that decide run again, locked, with the insert.
 *
 * @throws {TooManyVideosInProgressError} When the person has no free processing slot.
 * @throws {StorageQuotaExceededError} When the upload does not fit in the free space.
 */
export async function reserveUploadSpace(request: UploadSpaceRequest): Promise<() => void> {
    const { userId, declaredBytes } = request;
    const reservation = { release: (): void => {} };

    try {
        // The start lock makes reading the pending uploads and adding this one a single step.
        await runVideoStartTransaction(userId, async ({ transaction }) => {
            const pending = uploadReservations.summarize(userId);
            await assertCanStartAnotherVideo(userId, transaction, pending.count);
            await assertStorageAvailable(
                { userId, incomingBytes: pending.bytes + declaredBytes },
                transaction,
            );
            reservation.release = uploadReservations.reserve(userId, declaredBytes);
        });
    } catch (error) {
        reservation.release();
        throw error;
    }

    return reservation.release;
}
