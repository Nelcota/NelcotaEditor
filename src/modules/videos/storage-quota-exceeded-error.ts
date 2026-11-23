import { UserFacingError } from "#/shared/server/user-facing-error";
import { formatBytes } from "#/shared/ui/format";

const FREE_SPACE_HINT = "Exclua vídeos antigos para liberar espaço.";

export interface StorageShortfall {
    /** Saved files plus uploads still writing. */
    usedBytes: number;
    /** The video that did not fit; 0 when its size is not known yet. */
    incomingBytes: number;
    quotaBytes: number;
}

function describeShortfall(shortfall: StorageShortfall): string {
    const { usedBytes, incomingBytes, quotaBytes } = shortfall;

    if (usedBytes >= quotaBytes || incomingBytes === 0) {
        return `Seu espaço acabou (${formatBytes(usedBytes)} de ${formatBytes(quotaBytes)}). ${FREE_SPACE_HINT}`;
    }

    // "Seu espaço acabou" would be wrong here: there is room, just not enough for this video.
    const freeBytes = quotaBytes - usedBytes;

    return `Este vídeo tem ${formatBytes(incomingBytes)} e só restam ${formatBytes(freeBytes)} livres de ${formatBytes(quotaBytes)}. ${FREE_SPACE_HINT}`;
}

export class StorageQuotaExceededError extends UserFacingError {
    constructor(shortfall: StorageShortfall) {
        super(describeShortfall(shortfall));
        this.name = "StorageQuotaExceededError";
    }
}
