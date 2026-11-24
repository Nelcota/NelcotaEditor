import { diskFileStorage } from "#/shared/server/file-storage/disk-file-storage.server";
import type { FileStorage } from "#/shared/server/file-storage/file-storage";

export function getFileStorage(): FileStorage {
    return diskFileStorage;
}
