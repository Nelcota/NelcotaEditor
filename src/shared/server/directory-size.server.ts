import { readdir, stat } from "node:fs/promises";
import path from "node:path";

function isMissingPathError(error: unknown): boolean {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/** A directory that does not exist has no files. */
async function listFilePaths(absolutePath: string): Promise<Array<string>> {
    try {
        const entries = await readdir(absolutePath, { recursive: true, withFileTypes: true });
        const files = entries.filter((entry) => entry.isFile());

        return files.map((entry) => path.join(entry.parentPath, entry.name));
    } catch (error) {
        if (isMissingPathError(error) === true) {
            return [];
        }

        throw error;
    }
}

/** A file deleted between listing and measuring (e.g. a finished temp file) counts as 0. */
async function measureFileBytes(absolutePath: string): Promise<number> {
    try {
        const stats = await stat(absolutePath);
        return stats.size;
    } catch (error) {
        if (isMissingPathError(error) === true) {
            return 0;
        }

        throw error;
    }
}

/** Total bytes of every file under a directory; a directory that does not exist counts as 0. */
export async function measureDirectoryBytes(absolutePath: string): Promise<number> {
    const filePaths = await listFilePaths(absolutePath);
    const sizes = await Promise.all(filePaths.map((filePath) => measureFileBytes(filePath)));

    return sizes.reduce((total, size) => total + size, 0);
}
