import type { db } from "#/db/database.server";
import {
    getStorageQuotaBytes,
    measureUserStorage,
} from "#/modules/videos/server/usage-summary.server";
import { StorageQuotaExceededError } from "#/modules/videos/storage-quota-exceeded-error";

interface StorageRequest {
    userId: string;
    /** Bytes about to be stored; 0 when unknown. */
    incomingBytes: number;
    /** Uploads still writing, which have no row yet; they count as used. */
    reservedBytes?: number;
}

function assertValidByteCount(name: string, bytes: number): void {
    if (Number.isFinite(bytes) === false || bytes < 0) {
        throw new RangeError(`Invalid ${name} byte count: ${String(bytes)}`);
    }
}

/**
 * Throws when the user's files, plus the bytes about to arrive, pass the quota. A full account is
 * refused even for an unknown size, since any new video needs some space. Run it inside
 * runVideoStartTransaction so two requests cannot both fit in the same free space.
 */
export async function assertStorageAvailable(
    request: StorageRequest,
    executor: Pick<typeof db, "select">,
): Promise<void> {
    const { userId, incomingBytes } = request;
    const reservedBytes = request.reservedBytes ?? 0;

    if (userId.trim().length === 0) {
        throw new RangeError("Cannot check the storage quota of a user without an id");
    }

    assertValidByteCount("incoming", incomingBytes);
    assertValidByteCount("reserved", reservedBytes);

    const storage = await measureUserStorage(userId, executor);
    const usedBytes = storage.totalBytes + reservedBytes;
    const quotaBytes = getStorageQuotaBytes();

    if (usedBytes >= quotaBytes || usedBytes + incomingBytes > quotaBytes) {
        throw new StorageQuotaExceededError({ usedBytes, incomingBytes, quotaBytes });
    }
}
