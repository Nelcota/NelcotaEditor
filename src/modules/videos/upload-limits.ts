const BYTES_PER_GIGABYTE = 1024 * 1024 * 1024;
const MAX_UPLOAD_GIGABYTES = 5;

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
