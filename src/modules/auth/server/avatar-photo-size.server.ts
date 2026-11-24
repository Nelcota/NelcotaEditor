import { imageSize } from "image-size";
import type { AvatarPhotoExtension } from "#/modules/auth/model/avatar";
import { logger } from "#/shared/server/logger.server";

/**
 * A 2 MB file can declare 20000 × 20000 pixels, which every browser showing the avatar would
 * decode into about 1.6 GB of memory. The header says the size, so it is checked before storing.
 */
export const MAX_AVATAR_SIDE_PIXELS = 4096;

export interface PhotoSize {
    width: number;
    height: number;
}

/** image-size names the formats the same way the avatar extensions do. */
function readHeader(bytes: Uint8Array): { type: string; size: PhotoSize } | null {
    try {
        const result = imageSize(bytes);
        const type = result.type ?? "";

        return { type, size: { width: result.width, height: result.height } };
    } catch (error) {
        // A header image-size cannot read is refused like any other unreadable photo.
        logger.warn({ error }, "Could not read the avatar photo header");
        return null;
    }
}

/**
 * The pixel size the file declares; null when its header cannot be read or names another format
 * than the one its first bytes showed (then it is refused).
 */
export function readAvatarSize(
    bytes: Uint8Array,
    extension: AvatarPhotoExtension,
): PhotoSize | null {
    if (bytes.length === 0) {
        return null;
    }

    const header = readHeader(bytes);

    if (header === null || header.type !== extension) {
        return null;
    }

    return header.size;
}

export function isAvatarSizeAllowed(size: PhotoSize): boolean {
    if (size.width < 1 || size.height < 1) {
        return false;
    }

    return size.width <= MAX_AVATAR_SIDE_PIXELS && size.height <= MAX_AVATAR_SIDE_PIXELS;
}
