import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

export class UploadLargerThanDeclaredError extends Error {
    constructor(maxBytes: number) {
        super(`Upload is larger than its declared ${maxBytes} bytes`);
        this.name = "UploadLargerThanDeclaredError";
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
                    throw new UploadLargerThanDeclaredError(maxBytes);
                }

                controller.enqueue(chunk);
            },
        }),
    );
}

interface UploadTarget {
    /** The reserved upload's key. */
    sourcePath: string;
    /** The size the upload declared and reserved. */
    maxBytes: number;
}

/** Saves the body as the reserved upload's file and returns its size. */
export async function storeVideoUpload(
    body: ReadableStream<Uint8Array>,
    target: UploadTarget,
): Promise<number> {
    const { sourcePath, maxBytes } = target;

    if (Number.isSafeInteger(maxBytes) === false || maxBytes <= 0) {
        throw new RangeError(`Invalid upload size limit: ${String(maxBytes)}`);
    }

    const storage = getFileStorage();
    const sourceBytes = await storage.storeStream(sourcePath, capStreamBytes(body, maxBytes));

    if (sourceBytes === 0) {
        await storage.deleteFile(sourcePath);
        throw new EmptyUploadError();
    }

    return sourceBytes;
}
