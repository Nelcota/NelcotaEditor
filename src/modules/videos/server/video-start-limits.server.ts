import type { db } from "#/db/database.server";
import { summarizePendingUploads } from "#/modules/videos/server/pending-uploads.server";
import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";

interface VideoStartRequest {
    userId: string;
    /** Bytes about to be stored; 0 when unknown. */
    incomingBytes: number;
}

/**
 * The processing limit and the storage quota for any start that is not an upload. Reserved
 * uploads have no video row yet but already hold a slot and space, so they count: otherwise a
 * link or a retry could take the slot and the upload's confirmation would throw its file away.
 * Run it inside runVideoStartTransaction.
 */
export async function assertVideoStartAllowed(
    request: VideoStartRequest,
    executor: Pick<typeof db, "select">,
): Promise<void> {
    const { userId, incomingBytes } = request;
    const pending = await summarizePendingUploads(userId, executor, null);
    await assertCanStartAnotherVideo(userId, executor, pending.count);
    await assertStorageAvailable({ userId, incomingBytes, reservedBytes: pending.bytes }, executor);
}
