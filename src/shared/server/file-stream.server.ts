import fileSystem from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";

const CHUNK_SIZE_BYTES = 256 * 1024;

export class InvalidStreamRangeError extends Error {
    constructor(start: number, end: number) {
        super(`Invalid byte range to stream: ${start}-${end}`);
        this.name = "InvalidStreamRangeError";
    }
}

export class FileNotOpenError extends Error {
    constructor(absolutePath: string) {
        super(`File stream was read before ${absolutePath} was opened`);
        this.name = "FileNotOpenError";
    }
}

/** Reads the next chunk at `position`, at most `remainingBytes` long; empty at end of file. */
async function readChunk(
    fileHandle: FileHandle,
    position: number,
    remainingBytes: number,
): Promise<Uint8Array> {
    const buffer = new Uint8Array(Math.min(CHUNK_SIZE_BYTES, remainingBytes));
    const readResult = await fileHandle.read(buffer, 0, buffer.length, position);

    return buffer.subarray(0, readResult.bytesRead);
}

function assertValidRange(start: number, end: number): void {
    // end = start - 1 is an empty range (a zero-byte file).
    if (Number.isSafeInteger(start) === false || Number.isSafeInteger(end) === false) {
        throw new InvalidStreamRangeError(start, end);
    }

    if (start < 0 || end < start - 1) {
        throw new InvalidStreamRangeError(start, end);
    }
}

/** The storage-relative tail (for example "<video id>/source.mp4"), enough to find the file without logging the server's directories. */
function describeFileForLog(absolutePath: string): string {
    const parentDirectory = path.basename(path.dirname(absolutePath));
    const fileName = path.basename(absolutePath);

    return `${parentDirectory}/${fileName}`;
}

/** Streams the inclusive byte range [start, end] of a file as a web stream. */
export function createFileStream(
    absolutePath: string,
    start: number,
    end: number,
): ReadableStream<Uint8Array> {
    assertValidRange(start, end);

    let fileHandle: FileHandle | null = null;
    let isCancelled = false;
    let position = start;

    const enqueueNextChunk = async (
        handle: FileHandle,
        controller: ReadableStreamDefaultController<Uint8Array>,
    ): Promise<void> => {
        const chunk = await readChunk(handle, position, end - position + 1);

        if (chunk.length === 0) {
            await handle.close();
            controller.close();
            return;
        }

        position += chunk.length;
        controller.enqueue(chunk);
    };

    return new ReadableStream<Uint8Array>({
        // Opening here (not eagerly) turns a failed open into a stream error, never an unhandled rejection.
        async start() {
            const handle = await fileSystem.open(absolutePath, "r");

            // cancel() does not wait for start(): a HEAD request or an aborted download can cancel
            // while the file is still opening, and nothing else would ever close it.
            if (isCancelled === true) {
                await handle.close();
                return;
            }

            fileHandle = handle;
        },
        async pull(controller) {
            if (fileHandle === null) {
                throw new FileNotOpenError(absolutePath);
            }

            const handle = fileHandle;

            try {
                await enqueueNextChunk(handle, controller);
            } catch (error) {
                // The response has already started, so the route handler cannot log this failure.
                console.warn(
                    `File stream failed mid-way: ${describeFileForLog(absolutePath)}`,
                    error,
                );
                // A failed read errors the stream, which never calls cancel(); close the file here.
                await handle.close();
                throw error;
            }
        },
        async cancel() {
            isCancelled = true;

            if (fileHandle === null) {
                return;
            }

            await fileHandle.close();
        },
    });
}
