import { readdir, rm } from "node:fs/promises";
import path from "node:path";

// yt-dlp names every file of a download after the "source.%(ext)s" template: the partial files,
// each format before the merge and the merged file.
const DOWNLOAD_FILE_PREFIX = "source.";

function isMissingDirectoryError(error: unknown): boolean {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function listFileNames(directory: string): Promise<Array<string>> {
    try {
        return await readdir(directory);
    } catch (error) {
        if (isMissingDirectoryError(error) === true) {
            return [];
        }

        throw error;
    }
}

/**
 * Deletes what a download left in a video's folder (absolute path); the other files stay. Nothing
 * in the database points at a download that was cancelled, failed or refused, so nothing else
 * would ever delete it, and the quota, which sums the database, would never see it.
 */
export async function removeDownloadFiles(videoDirectory: string): Promise<void> {
    const fileNames = await listFileNames(videoDirectory);
    const downloadFileNames = fileNames.filter((fileName) =>
        fileName.startsWith(DOWNLOAD_FILE_PREFIX),
    );

    await Promise.all(
        downloadFileNames.map((fileName) =>
            rm(path.join(videoDirectory, fileName), { recursive: true, force: true }),
        ),
    );
}
