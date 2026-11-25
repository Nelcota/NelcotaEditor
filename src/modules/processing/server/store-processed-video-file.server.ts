import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

interface ProcessedVideoFile {
    key: string;
    localPath: string;
    signal: AbortSignal;
}

interface StoredVideoFile {
    bytes: number;
    storageDurationMs: number;
}

/** A file refused by the quota or left without a database row must not stay in storage. */
export async function storeProcessedVideoFile(
    file: ProcessedVideoFile,
    record: (bytes: number) => Promise<void>,
): Promise<StoredVideoFile> {
    const { key, localPath, signal } = file;
    const storage = getFileStorage();
    signal.throwIfAborted();
    const storageStartedAt = performance.now();
    const bytes = await storage.storeLocalFile(key, localPath, { signal });
    const storageDurationMs = Math.round(performance.now() - storageStartedAt);

    try {
        signal.throwIfAborted();
        await record(bytes);
    } catch (error) {
        await storage.deleteFile(key);
        throw error;
    }

    return { bytes, storageDurationMs };
}
