import { diskFileStorage } from "#/shared/server/file-storage/disk-file-storage.server";
import type { FileStorage } from "#/shared/server/file-storage/file-storage";
import { createR2FileStorage } from "#/shared/server/file-storage/r2-file-storage.server";
import { getEnvironment } from "#/shared/server/env.server";

export class MissingR2SettingError extends Error {
    constructor() {
        super("STORAGE_DRIVER is r2 but an R2 setting is missing");
        this.name = "MissingR2SettingError";
    }
}

// The R2 client keeps its connections open, so it is built once and shared.
let r2FileStorage: FileStorage | null = null;

/** The R2 adapter whatever STORAGE_DRIVER says: scripts use it to copy and check files. */
export function getR2FileStorage(): FileStorage {
    if (r2FileStorage !== null) {
        return r2FileStorage;
    }

    const environment = getEnvironment();
    const accountId = environment.R2_ACCOUNT_ID;
    const accessKeyId = environment.R2_ACCESS_KEY_ID;
    const secretAccessKey = environment.R2_SECRET_ACCESS_KEY;
    const bucket = environment.R2_BUCKET;

    // The environment schema already demands them; this narrows the types.
    if (
        accountId === undefined ||
        accessKeyId === undefined ||
        secretAccessKey === undefined ||
        bucket === undefined
    ) {
        throw new MissingR2SettingError();
    }

    r2FileStorage = createR2FileStorage({
        accountId,
        accessKeyId,
        secretAccessKey,
        bucket,
        spoolDirectory: environment.WORK_DIR,
    });
    return r2FileStorage;
}

export function getFileStorage(): FileStorage {
    const environment = getEnvironment();

    if (environment.STORAGE_DRIVER === "r2") {
        return getR2FileStorage();
    }

    return diskFileStorage;
}
