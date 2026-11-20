export interface ByteRange {
    start: number;
    end: number;
}

/** Only one range is supported: multi-range requests need a multipart response. */
const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/;

export class InvalidFileSizeError extends Error {
    constructor(fileSize: number) {
        super(`File size must be a non-negative integer, got ${fileSize}`);
        this.name = "InvalidFileSizeError";
    }
}

function parseSuffixRange(suffixText: string, fileSize: number): ByteRange | null {
    const suffixLength = Number(suffixText);

    if (Number.isFinite(suffixLength) === false || suffixLength <= 0) {
        return null;
    }

    return { start: Math.max(0, fileSize - suffixLength), end: fileSize - 1 };
}

function parseRangeEnd(endText: string, fileSize: number): number {
    const lastByte = fileSize - 1;

    if (endText.length === 0) {
        return lastByte;
    }

    return Math.min(Number(endText), lastByte);
}

function parseStartRange(startText: string, endText: string, fileSize: number): ByteRange | null {
    const start = Number(startText);
    const end = parseRangeEnd(endText, fileSize);

    if (Number.isFinite(start) === false || start > end) {
        return null;
    }

    return { start, end };
}

/**
 * Parses a single HTTP Range header (what video players send to seek).
 * Returns undefined when the whole file should be sent (no header, or one this server ignores,
 * which RFC 9110 allows) and null when the range cannot be satisfied.
 */
export function parseByteRange(
    header: string | null,
    fileSize: number,
): ByteRange | null | undefined {
    if (Number.isSafeInteger(fileSize) === false || fileSize < 0) {
        throw new InvalidFileSizeError(fileSize);
    }

    if (header === null) {
        return undefined;
    }

    const match = RANGE_PATTERN.exec(header.trim());

    if (match === null) {
        return undefined;
    }

    const startText = match[1] ?? "";
    const endText = match[2] ?? "";

    if (startText.length === 0 && endText.length === 0) {
        return undefined;
    }

    if (fileSize === 0) {
        return null;
    }

    if (startText.length === 0) {
        return parseSuffixRange(endText, fileSize);
    }

    return parseStartRange(startText, endText, fileSize);
}
