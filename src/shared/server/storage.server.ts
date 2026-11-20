import path from "node:path";
import { getEnvironment } from "#/shared/server/env.server";

export class StoragePathError extends Error {
    constructor(relativePath: string) {
        super(`Path escapes the storage directory: ${relativePath}`);
        this.name = "StoragePathError";
    }
}

// Video ids are UUIDs; anything else (a "/" or "..") could point the path at another folder.
const VIDEO_ID_PATTERN = /^[A-Za-z0-9-]+$/;

export class InvalidVideoIdError extends Error {
    constructor(videoId: string) {
        super(`Invalid video id for a storage path: ${videoId}`);
        this.name = "InvalidVideoIdError";
    }
}

function getStorageRoot(): string {
    const environment = getEnvironment();
    return path.resolve(environment.STORAGE_DIR);
}

/** Paths are stored relative (with forward slashes) so the app and the worker container agree. */
export function resolveStoragePath(relativePath: string): string {
    const storageRoot = getStorageRoot();
    const absolutePath = path.resolve(storageRoot, relativePath);

    if (absolutePath.startsWith(storageRoot + path.sep) === false) {
        throw new StoragePathError(relativePath);
    }

    return absolutePath;
}

export function getVideoDirectory(videoId: string): string {
    if (VIDEO_ID_PATTERN.test(videoId) === false) {
        throw new InvalidVideoIdError(videoId);
    }

    return path.posix.join("videos", videoId);
}
