import { mkdir, open, rm } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/model/upload-limits";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

const SOURCE_FILE_NAME = "source";

export class UploadTooLargeError extends Error {
    constructor(maxBytes: number) {
        super(`Upload is larger than ${maxBytes} bytes`);
        this.name = "UploadTooLargeError";
    }
}

export class EmptyUploadError extends Error {
    constructor() {
        super("Upload body has no bytes");
        this.name = "EmptyUploadError";
    }
}

interface UploadDestination {
    fileHandle: FileHandle;
    /** The space reserved for the upload; a body that sends more is refused. */
    maxBytes: number;
}

/** Copies every chunk to the file and returns how many bytes were written. */
async function copyChunks(
    body: ReadableStream<Uint8Array>,
    destination: UploadDestination,
): Promise<number> {
    const { fileHandle, maxBytes } = destination;
    const reader = body.getReader();
    let writtenBytes = 0;

    for (let chunk = await reader.read(); chunk.done === false; chunk = await reader.read()) {
        const bytes = chunk.value;
        writtenBytes += bytes.byteLength;

        if (writtenBytes > maxBytes) {
            throw new UploadTooLargeError(maxBytes);
        }

        await fileHandle.write(bytes);
    }

    return writtenBytes;
}

/** Writes the body straight to disk, so multi-gigabyte files never sit in memory. */
async function writeBodyToFile(
    body: ReadableStream<Uint8Array>,
    target: { absolutePath: string; maxBytes: number },
): Promise<number> {
    const fileHandle = await open(target.absolutePath, "w");
    let writtenBytes = 0;

    try {
        writtenBytes = await copyChunks(body, { fileHandle, maxBytes: target.maxBytes });
    } finally {
        await fileHandle.close();
    }

    if (writtenBytes === 0) {
        throw new EmptyUploadError();
    }

    return writtenBytes;
}

export async function removeVideoDirectory(videoId: string): Promise<void> {
    await rm(resolveStoragePath(getVideoDirectory(videoId)), { recursive: true, force: true });
}

interface UploadTarget {
    videoId: string;
    extension: string;
    /** The upload's reserved size, at most MAX_UPLOAD_BYTES. */
    maxBytes: number;
}

export interface StoredUpload {
    sourcePath: string;
    sourceBytes: number;
}

/** Saves the upload as the video's source file and returns its relative path and size. */
export async function storeVideoUpload(
    body: ReadableStream<Uint8Array>,
    target: UploadTarget,
): Promise<StoredUpload> {
    const maxBytes = target.maxBytes;

    if (Number.isSafeInteger(maxBytes) === false || maxBytes <= 0 || maxBytes > MAX_UPLOAD_BYTES) {
        throw new RangeError(`Invalid upload size limit: ${String(maxBytes)}`);
    }

    const videoDirectory = getVideoDirectory(target.videoId);
    const sourcePath = path.posix.join(videoDirectory, `${SOURCE_FILE_NAME}${target.extension}`);

    await mkdir(resolveStoragePath(videoDirectory), { recursive: true });

    try {
        const sourceBytes = await writeBodyToFile(body, {
            absolutePath: resolveStoragePath(sourcePath),
            maxBytes,
        });
        return { sourcePath, sourceBytes };
    } catch (error) {
        await removeVideoDirectory(target.videoId);
        throw error;
    }
}
