import { r2Endpoint } from "#/shared/server/file-storage/r2-file-storage.server";
import { getEnvironment } from "#/shared/server/env.server";

/**
 * The origin browsers load stored media from when it is not the app itself. Signed R2 links only
 * work on the account's own endpoint, never on a custom domain.
 */
export function getStorageMediaOrigin(): string | null {
    const environment = getEnvironment();
    const accountId = environment.R2_ACCOUNT_ID;

    if (environment.STORAGE_DRIVER !== "r2" || accountId === undefined) {
        return null;
    }

    return r2Endpoint(accountId);
}
