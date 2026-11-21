import { stat } from "node:fs/promises";
import { isFileNotFoundError } from "#/shared/server/fs-errors";

/** Size of a file in bytes; a file that does not exist counts as 0, the space it takes. */
export async function measureFileBytes(absolutePath: string): Promise<number> {
    try {
        const stats = await stat(absolutePath);
        return stats.size;
    } catch (error) {
        if (isFileNotFoundError(error) === true) {
            return 0;
        }

        throw error;
    }
}
