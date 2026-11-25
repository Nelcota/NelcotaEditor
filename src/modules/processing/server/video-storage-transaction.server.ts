import { summarizePendingUploads } from "#/modules/videos/server/pending-uploads.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import type { VideoStartScope } from "#/modules/videos/server/video-start-transaction.server";

interface VideoStorageChange {
    userId: string;
    byteDelta: number;
}

/** Account for stored files and outstanding upload reservations under the same lock. */
export async function runVideoStorageTransaction(
    change: VideoStorageChange,
    write: (transaction: VideoStartScope["transaction"]) => Promise<void>,
): Promise<void> {
    const { userId, byteDelta } = change;

    if (Number.isSafeInteger(byteDelta) === false) {
        throw new RangeError(`Invalid storage change for user ${userId}: ${byteDelta}`);
    }

    await runVideoStartTransaction(userId, async ({ transaction }) => {
        if (byteDelta > 0) {
            const pending = await summarizePendingUploads(userId, transaction, null);
            await assertStorageAvailable(
                { userId, incomingBytes: byteDelta, reservedBytes: pending.bytes },
                transaction,
            );
        }

        await write(transaction);
    });
}
