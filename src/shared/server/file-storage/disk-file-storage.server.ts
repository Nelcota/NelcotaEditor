import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, rm } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { measureFileBytes } from "#/shared/server/directory-size.server";
import type {
    FileStorage,
    ServedFile,
    TransferOptions,
} from "#/shared/server/file-storage/file-storage";
import { respondWithFileRange } from "#/shared/server/serve-file-range.server";
import { resolveStoragePath } from "#/shared/server/storage.server";

const PARTIAL_FILE_SUFFIX = ".partial";

/**
 * Writes to a partial file next to the target and renames it at the end, so a reader never sees
 * half a file and a failure leaves nothing behind.
 */
async function writeAtomically(
    key: string,
    write: (partialPath: string) => Promise<void>,
): Promise<string> {
    const absolutePath = resolveStoragePath(key);
    const partialPath = `${absolutePath}${PARTIAL_FILE_SUFFIX}`;

    await mkdir(path.dirname(absolutePath), { recursive: true });

    try {
        await write(partialPath);
        await rename(partialPath, absolutePath);
    } catch (error) {
        await rm(partialPath, { force: true });
        throw error;
    }

    return absolutePath;
}

/**
 * Streamed instead of copied in one call, so a cancelled run stops a multi-gigabyte copy.
 * copyFile cannot be stopped once started, but it is faster (it can use copy_file_range or a
 * reflink): about 0.3 to 0.8 s per GB against 1.5 to 4.5 s streamed, measured with Bun on Linux and
 * Windows. A few seconds on a large source is worth a cancel that takes effect right away.
 */
async function storeLocalFile(
    key: string,
    localPath: string,
    options: TransferOptions = {},
): Promise<number> {
    const absolutePath = await writeAtomically(key, (partialPath) =>
        pipeline(createReadStream(localPath), createWriteStream(partialPath), {
            signal: options.signal,
        }),
    );

    return measureFileBytes(absolutePath);
}

async function writeStreamToFile(
    stream: ReadableStream<Uint8Array>,
    absolutePath: string,
): Promise<number> {
    const fileHandle = await open(absolutePath, "w");
    let writtenBytes = 0;

    try {
        for await (const chunk of stream) {
            await fileHandle.write(chunk);
            writtenBytes += chunk.byteLength;
        }
    } finally {
        await fileHandle.close();
    }

    return writtenBytes;
}

/** Writes chunk by chunk, so multi-gigabyte uploads never sit in memory. */
async function storeStream(key: string, stream: ReadableStream<Uint8Array>): Promise<number> {
    let writtenBytes = 0;

    await writeAtomically(key, async (partialPath) => {
        writtenBytes = await writeStreamToFile(stream, partialPath);
    });

    return writtenBytes;
}

/** Nothing outside the app can write to this disk, so uploads go through the app. */
function createUploadUrl(): Promise<string | null> {
    return Promise.resolve(null);
}

/** The file is already on this disk, so ffmpeg reads it in place; nothing is copied. */
function getLocalFile(key: string): Promise<string> {
    return Promise.resolve(resolveStoragePath(key));
}

function measureFile(key: string): Promise<number> {
    return measureFileBytes(resolveStoragePath(key));
}

async function deleteFile(key: string): Promise<void> {
    await rm(resolveStoragePath(key), { force: true });
}

async function deleteFolder(prefix: string): Promise<void> {
    await rm(resolveStoragePath(prefix), { recursive: true, force: true });
}

function respondWithFile(request: Request, file: ServedFile): Promise<Response> {
    return respondWithFileRange(request, resolveStoragePath(file.key), file.headers);
}

/** Files under STORAGE_DIR on this machine: development, tests, and a single-server setup. */
export const diskFileStorage: FileStorage = {
    storeLocalFile,
    createUploadUrl,
    storeStream,
    getLocalFile,
    measureFile,
    deleteFile,
    deleteFolder,
    respondWithFile,
};
