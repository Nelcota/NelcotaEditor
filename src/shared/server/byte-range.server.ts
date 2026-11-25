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

function parseSuffixRange(suffixLength: bigint, fileSize: bigint): ByteRange | null {
    if (suffixLength === 0n) {
        return null;
    }

    const end = Number(fileSize - 1n);

    if (suffixLength >= fileSize) {
        return { start: 0, end };
    }

    return { start: Number(fileSize - suffixLength), end };
}

function parseStartRange(start: bigint, end: bigint | null, fileSize: bigint): ByteRange | null {
    if (start >= fileSize) {
        return null;
    }

    const lastByte = fileSize - 1n;

    if (end === null || end > lastByte) {
        return { start: Number(start), end: Number(lastByte) };
    }

    return { start: Number(start), end: Number(end) };
}

function readPosition(digits: string): bigint | null {
    if (digits.length === 0) {
        return null;
    }

    return BigInt(digits);
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

    const start = readPosition(match[1] ?? "");
    const end = readPosition(match[2] ?? "");

    if (start === null && end === null) {
        return undefined;
    }

    if (start !== null && end !== null && end < start) {
        return undefined;
    }

    if (fileSize === 0) {
        return null;
    }

    const size = BigInt(fileSize);

    if (start === null && end !== null) {
        return parseSuffixRange(end, size);
    }

    return parseStartRange(start ?? 0n, end, size);
}
