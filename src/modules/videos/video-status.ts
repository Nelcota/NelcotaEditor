export const VIDEO_STATUSES = [
    "queued",
    "downloading",
    "transcribing",
    "selecting",
    "rendering",
    "done",
    "failed",
    "cancelled",
] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export const VIDEO_SOURCES = ["upload", "youtube"] as const;

export type VideoSource = (typeof VIDEO_SOURCES)[number];

export const MIN_CLIP_COUNT = 1;
export const MAX_CLIP_COUNT = 10;
export const DEFAULT_CLIP_COUNT = 5;

/** Statuses the worker no longer touches. */
export const FINISHED_VIDEO_STATUSES: Array<VideoStatus> = ["done", "failed", "cancelled"];

/** Statuses the user can resume from; finished steps are kept. */
const RESUMABLE_STATUSES: ReadonlyArray<VideoStatus> = ["failed", "cancelled"];

/** Statuses the user can cancel: waiting in the queue or being processed. */
const CANCELLABLE_STATUSES: ReadonlyArray<VideoStatus> = [
    "queued",
    "downloading",
    "transcribing",
    "selecting",
    "rendering",
];

/** Statuses where the worker is actively touching the video's files. */
export const WORKING_VIDEO_STATUSES: Array<VideoStatus> = [
    "downloading",
    "transcribing",
    "selecting",
    "rendering",
];

export const MAX_VIDEO_DURATION_SECONDS = 3 * 60 * 60;

export function isVideoFinished(status: VideoStatus): boolean {
    return FINISHED_VIDEO_STATUSES.includes(status);
}

export function isVideoWorking(status: VideoStatus): boolean {
    return WORKING_VIDEO_STATUSES.includes(status);
}

export function isVideoResumable(status: VideoStatus): boolean {
    return RESUMABLE_STATUSES.includes(status);
}

export function isVideoCancellable(status: VideoStatus): boolean {
    return CANCELLABLE_STATUSES.includes(status);
}

/** Before these, the original file is missing or still being written. */
const ORIGINAL_NOT_READY_STATUSES: ReadonlyArray<VideoStatus> = ["queued", "downloading"];

export function isOriginalPlayable(status: VideoStatus): boolean {
    return ORIGINAL_NOT_READY_STATUSES.includes(status) === false;
}
