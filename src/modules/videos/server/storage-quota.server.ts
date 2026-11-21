import type { db } from "#/db/database.server";
import {
    getStorageQuotaBytes,
    measureUserStorage,
} from "#/modules/videos/server/usage-summary.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { formatBytes } from "#/shared/ui/format";

export class StorageQuotaExceededError extends UserFacingError {
    constructor(usedBytes: number, quotaBytes: number) {
        super(
            `Seu espaço acabou (${formatBytes(usedBytes)} de ${formatBytes(quotaBytes)}). Exclua vídeos antigos para liberar espaço.`,
        );
        this.name = "StorageQuotaExceededError";
    }
}

interface StorageRequest {
    userId: string;
    /** Bytes about to be stored; 0 when unknown. */
    incomingBytes: number;
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

    if (userId.trim().length === 0) {
        throw new RangeError("Cannot check the storage quota of a user without an id");
    }

    if (Number.isFinite(incomingBytes) === false || incomingBytes < 0) {
        throw new RangeError(`Invalid incoming byte count: ${String(incomingBytes)}`);
    }

    const storage = await measureUserStorage(userId, executor);
    const usedBytes = storage.totalBytes;
    const quotaBytes = getStorageQuotaBytes();

    if (usedBytes >= quotaBytes || usedBytes + incomingBytes > quotaBytes) {
        throw new StorageQuotaExceededError(usedBytes, quotaBytes);
    }
}
