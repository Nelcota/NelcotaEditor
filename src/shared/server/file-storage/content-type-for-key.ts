import path from "node:path";

/** What the store answers with when a browser loads the file straight from it. */
const CONTENT_TYPES: Record<string, string> = {
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
};

const FALLBACK_CONTENT_TYPE = "application/octet-stream";

export function contentTypeForKey(key: string): string {
    const extension = path.posix.extname(key).toLowerCase();

    return CONTENT_TYPES[extension] ?? FALLBACK_CONTENT_TYPE;
}
