import type { AvatarPhotoExtension } from "#/modules/auth/avatar";

/**
 * A 2 MB file can declare 20000 × 20000 pixels, which every browser showing the avatar would
 * decode into about 1.6 GB of memory. The header says the size, so it is checked before storing.
 */
export const MAX_AVATAR_SIDE_PIXELS = 4096;

export interface PhotoSize {
    width: number;
    height: number;
}

// PNG: the IHDR chunk always comes first; width and height are big-endian at bytes 16 and 20.
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

// JPEG: the frame header (a SOFn marker) holds height then width, 5 and 7 bytes after the marker.
const JPEG_MARKER_PREFIX = 0xff;
const JPEG_FIRST_SEGMENT_OFFSET = 2;
const JPEG_SOF_HEIGHT_OFFSET = 5;
const JPEG_SOF_WIDTH_OFFSET = 7;
// SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC), which share the range but are not frames.
const JPEG_FRAME_MARKERS = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

// WebP: the first chunk after "WEBP" says which encoding, and each keeps the size elsewhere.
const WEBP_CHUNK_TYPE_OFFSET = 12;
const VP8_WIDTH_OFFSET = 26;
const VP8_HEIGHT_OFFSET = 28;
const VP8_SIDE_MASK = 0x3fff;
const VP8L_SIZE_OFFSET = 21;
const VP8L_SIDE_BITS = 14;
const VP8X_WIDTH_OFFSET = 24;
const VP8X_HEIGHT_OFFSET = 27;

function readUint16BigEndian(bytes: Uint8Array, offset: number): number | null {
    const high = bytes[offset];
    const low = bytes[offset + 1];

    if (high === undefined || low === undefined) {
        return null;
    }

    return (high << 8) | low;
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number | null {
    const high = readUint16BigEndian(bytes, offset);
    const low = readUint16BigEndian(bytes, offset + 2);

    if (high === null || low === null) {
        return null;
    }

    return high * 0x10000 + low;
}

function readUintLittleEndian(bytes: Uint8Array, offset: number, length: number): number | null {
    let value = 0;

    for (let index = length - 1; index >= 0; index -= 1) {
        const byte = bytes[offset + index];

        if (byte === undefined) {
            return null;
        }

        value = value * 0x100 + byte;
    }

    return value;
}

function toSize(width: number | null, height: number | null): PhotoSize | null {
    if (width === null || height === null) {
        return null;
    }

    return { width, height };
}

function readPngSize(bytes: Uint8Array): PhotoSize | null {
    return toSize(
        readUint32BigEndian(bytes, PNG_WIDTH_OFFSET),
        readUint32BigEndian(bytes, PNG_HEIGHT_OFFSET),
    );
}

/** Walks the segments until the frame header; each segment says its own length. */
function readJpegSize(bytes: Uint8Array): PhotoSize | null {
    let offset = JPEG_FIRST_SEGMENT_OFFSET;

    while (offset + JPEG_SOF_WIDTH_OFFSET + 1 < bytes.length) {
        const marker = bytes[offset + 1];
        const segmentLength = readUint16BigEndian(bytes, offset + 2);

        if (
            bytes[offset] !== JPEG_MARKER_PREFIX ||
            marker === undefined ||
            segmentLength === null
        ) {
            return null;
        }

        if (JPEG_FRAME_MARKERS.has(marker) === true) {
            return toSize(
                readUint16BigEndian(bytes, offset + JPEG_SOF_WIDTH_OFFSET),
                readUint16BigEndian(bytes, offset + JPEG_SOF_HEIGHT_OFFSET),
            );
        }

        offset += 2 + segmentLength;
    }

    return null;
}

function readVp8lSize(bytes: Uint8Array): PhotoSize | null {
    const packed = readUintLittleEndian(bytes, VP8L_SIZE_OFFSET, 4);

    if (packed === null) {
        return null;
    }

    const sideMask = (1 << VP8L_SIDE_BITS) - 1;
    const width = (packed & sideMask) + 1;
    const height = (Math.floor(packed / (1 << VP8L_SIDE_BITS)) & sideMask) + 1;

    return { width, height };
}

function readVp8xSize(bytes: Uint8Array): PhotoSize | null {
    const widthMinusOne = readUintLittleEndian(bytes, VP8X_WIDTH_OFFSET, 3);
    const heightMinusOne = readUintLittleEndian(bytes, VP8X_HEIGHT_OFFSET, 3);

    if (widthMinusOne === null || heightMinusOne === null) {
        return null;
    }

    return { width: widthMinusOne + 1, height: heightMinusOne + 1 };
}

function readVp8Size(bytes: Uint8Array): PhotoSize | null {
    const width = readUintLittleEndian(bytes, VP8_WIDTH_OFFSET, 2);
    const height = readUintLittleEndian(bytes, VP8_HEIGHT_OFFSET, 2);

    if (width === null || height === null) {
        return null;
    }

    return { width: width & VP8_SIDE_MASK, height: height & VP8_SIDE_MASK };
}

const WEBP_SIZE_READERS: Record<string, (bytes: Uint8Array) => PhotoSize | null> = {
    "VP8 ": readVp8Size,
    VP8L: readVp8lSize,
    VP8X: readVp8xSize,
};

function readWebpSize(bytes: Uint8Array): PhotoSize | null {
    const chunkType = String.fromCharCode(
        ...bytes.subarray(WEBP_CHUNK_TYPE_OFFSET, WEBP_CHUNK_TYPE_OFFSET + 4),
    );
    const readSize = WEBP_SIZE_READERS[chunkType];

    if (readSize === undefined) {
        return null;
    }

    return readSize(bytes);
}

const SIZE_READERS: Record<AvatarPhotoExtension, (bytes: Uint8Array) => PhotoSize | null> = {
    png: readPngSize,
    jpg: readJpegSize,
    webp: readWebpSize,
};

/** The pixel size the file declares; null when its header cannot be read (then it is refused). */
export function readAvatarSize(
    bytes: Uint8Array,
    extension: AvatarPhotoExtension,
): PhotoSize | null {
    return SIZE_READERS[extension](bytes);
}

export function isAvatarSizeAllowed(size: PhotoSize): boolean {
    if (size.width < 1 || size.height < 1) {
        return false;
    }

    return size.width <= MAX_AVATAR_SIDE_PIXELS && size.height <= MAX_AVATAR_SIDE_PIXELS;
}
