const BYTES_PER_GIGABYTE = 1000 * 1000 * 1000;
const MAX_UPLOAD_GIGABYTES = 5;

/**
 * 5 GB as the copy says it (decimal). It also stays under the largest single upload R2 takes
 * (5 GiB less 5 MiB), so a browser can send any accepted file in one request.
 */
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_GIGABYTES * BYTES_PER_GIGABYTE;

export const ALLOWED_VIDEO_EXTENSIONS: ReadonlyArray<string> = [
    ".mp4",
    ".mov",
    ".mkv",
    ".webm",
    ".avi",
    ".m4v",
];

export const MAX_TITLE_LENGTH = 120;
