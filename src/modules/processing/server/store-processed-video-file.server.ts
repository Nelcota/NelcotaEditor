import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

interface ProcessedVideoFile {
    key: string;
    localPath: string;
    signal: AbortSignal;
}

/** A file refused by the quota or left without a database row must not stay in storage. */
export async function storeProcessedVideoFile(
    file: ProcessedVideoFile,
    record: (bytes: number) => Promise<void>,
): Promise<void> {
    const { key, localPath, signal } = file;
    const storage = getFileStorage();
    signal.throwIfAborted();
    const bytes = await storage.storeLocalFile(key, localPath, { signal });

    try {
        signal.throwIfAborted();
        await record(bytes);
    } catch (error) {
        await storage.deleteFile(key);
        throw error;
    }
}
