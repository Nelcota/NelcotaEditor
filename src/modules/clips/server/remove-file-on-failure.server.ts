import { rm } from "node:fs/promises";

/**
 * Runs `work` and removes `absolutePath` if it fails or is cancelled, then rethrows. A half
 * written file has no size in the database, so left behind it would take space the quota never sees.
 */
export async function removeFileOnFailure<Result>(
    absolutePath: string,
    work: () => Promise<Result>,
): Promise<Result> {
    if (absolutePath.trim().length === 0) {
        throw new RangeError("Cannot guard work without the path of the file it writes");
    }

    try {
        return await work();
    } catch (error) {
        await rm(absolutePath, { force: true });
        throw error;
    }
}
