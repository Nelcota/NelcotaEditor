import path from "node:path";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/model/upload-limits";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

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

/** Errors the stream as soon as it passes the reserved size, whatever Content-Length claimed. */
function capStreamBytes(
    body: ReadableStream<Uint8Array>,
    maxBytes: number,
): ReadableStream<Uint8Array> {
    let receivedBytes = 0;

    return body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
                receivedBytes += chunk.byteLength;

                if (receivedBytes > maxBytes) {
                    throw new UploadTooLargeError(maxBytes);
                }

                controller.enqueue(chunk);
            },
        }),
    );
}

export async function removeVideoDirectory(videoId: string): Promise<void> {
    await getFileStorage().deleteFolder(getVideoDirectory(videoId));
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

async function storeCappedBody(
    body: ReadableStream<Uint8Array>,
    target: UploadTarget,
    sourcePath: string,
): Promise<number> {
    const sourceBytes = await getFileStorage().storeStream(
        sourcePath,
        capStreamBytes(body, target.maxBytes),
    );

    if (sourceBytes === 0) {
        throw new EmptyUploadError();
    }

    return sourceBytes;
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

    try {
        const sourceBytes = await storeCappedBody(body, target, sourcePath);
        return { sourcePath, sourceBytes };
    } catch (error) {
        await removeVideoDirectory(target.videoId);
        throw error;
    }
}
