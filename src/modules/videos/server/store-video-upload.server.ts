import { mkdir, open, rm } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/upload-limits";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

const SOURCE_FILE_NAME = "source";

export class UploadTooLargeError extends Error {
    constructor() {
        super(`Upload is larger than ${MAX_UPLOAD_BYTES} bytes`);
        this.name = "UploadTooLargeError";
    }
}

export class EmptyUploadError extends Error {
    constructor() {
        super("Upload body has no bytes");
        this.name = "EmptyUploadError";
    }
}

/** Copies every chunk to the file and returns how many bytes were written. */
async function copyChunks(
    body: ReadableStream<Uint8Array>,
    fileHandle: FileHandle,
): Promise<number> {
    const reader = body.getReader();
    let writtenBytes = 0;

    for (let chunk = await reader.read(); chunk.done === false; chunk = await reader.read()) {
        const bytes = chunk.value;
        writtenBytes += bytes.byteLength;

        if (writtenBytes > MAX_UPLOAD_BYTES) {
            throw new UploadTooLargeError();
        }

        await fileHandle.write(bytes);
    }

    return writtenBytes;
}

/** Writes the body straight to disk, so multi-gigabyte files never sit in memory. */
async function writeBodyToFile(
    body: ReadableStream<Uint8Array>,
    absolutePath: string,
): Promise<number> {
    const fileHandle = await open(absolutePath, "w");
    let writtenBytes = 0;

    try {
        writtenBytes = await copyChunks(body, fileHandle);
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
    const videoDirectory = getVideoDirectory(target.videoId);
    const sourcePath = path.posix.join(videoDirectory, `${SOURCE_FILE_NAME}${target.extension}`);

    await mkdir(resolveStoragePath(videoDirectory), { recursive: true });

    try {
        const sourceBytes = await writeBodyToFile(body, resolveStoragePath(sourcePath));
        return { sourcePath, sourceBytes };
    } catch (error) {
        await removeVideoDirectory(target.videoId);
        throw error;
    }
}
