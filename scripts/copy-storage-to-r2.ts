import type { Dirent } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getEnvironment } from "#/shared/server/env.server";
import { isFileNotFoundError } from "#/shared/server/fs-errors";
import { getR2FileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Copies every stored file from STORAGE_DIR to the R2 bucket under the same key, so the paths the
// database holds keep working once STORAGE_DRIVER is r2. Safe to run again: a file the bucket
// already holds at the same size is skipped. Add --dry-run to only list what would be copied.
const STORED_FOLDERS = ["videos", "avatars"];
const PARTIAL_FILE_SUFFIX = ".partial";
const DRY_RUN_FLAG = "--dry-run";

interface CopyTotals {
    copied: number;
    skipped: number;
    copiedBytes: number;
}

/** Keys use forward slashes whatever the system, as the database stores them. */
function toKey(storageRoot: string, absolutePath: string): string {
    return path.relative(storageRoot, absolutePath).split(path.sep).join(path.posix.sep);
}

/** A folder that was never created (no avatar yet) holds nothing to copy. */
async function listFolder(folderPath: string): Promise<Array<Dirent>> {
    try {
        return await readdir(folderPath, { recursive: true, withFileTypes: true });
    } catch (error) {
        if (isFileNotFoundError(error) === true) {
            return [];
        }

        throw error;
    }
}

async function listStoredFiles(storageRoot: string): Promise<Array<string>> {
    const files: Array<string> = [];

    for (const folder of STORED_FOLDERS) {
        const entries = await listFolder(path.join(storageRoot, folder));
        // A ".partial" file is a write that never finished; it is not part of the storage.
        const storedEntries = entries.filter(
            (entry) =>
                entry.isFile() === true && entry.name.endsWith(PARTIAL_FILE_SUFFIX) === false,
        );

        files.push(...storedEntries.map((entry) => path.join(entry.parentPath, entry.name)));
    }

    return files.toSorted();
}

/** Returns the bytes copied, or null when the bucket already held the file. */
async function copyFile(storageRoot: string, absolutePath: string): Promise<number | null> {
    const storage = getR2FileStorage();
    const key = toKey(storageRoot, absolutePath);
    const fileStats = await stat(absolutePath);
    const localBytes = fileStats.size;

    if ((await storage.measureFile(key)) === localBytes) {
        return null;
    }

    if (process.argv.includes(DRY_RUN_FLAG) === false) {
        await storage.storeLocalFile(key, absolutePath);
    }

    console.info(`copied ${key} (${localBytes} bytes)`);
    return localBytes;
}

async function copyStorageToR2(): Promise<void> {
    const storageRoot = path.resolve(getEnvironment().STORAGE_DIR);
    const files = await listStoredFiles(storageRoot);
    const totals: CopyTotals = { copied: 0, skipped: 0, copiedBytes: 0 };

    // One at a time: large videos, and the bucket limits concurrent requests per key prefix.
    for (const absolutePath of files) {
        const copiedBytes = await copyFile(storageRoot, absolutePath);

        if (copiedBytes === null) {
            totals.skipped += 1;
            continue;
        }

        totals.copied += 1;
        totals.copiedBytes += copiedBytes;
    }

    let mode = "done";

    if (process.argv.includes(DRY_RUN_FLAG) === true) {
        mode = "dry run";
    }

    console.info(
        `${mode}: ${files.length} files, ${totals.copied} copied (${totals.copiedBytes} bytes), ${totals.skipped} already in the bucket`,
    );
}

await copyStorageToR2();
process.exit(0);
