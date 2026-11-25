import type { ClipView } from "#/modules/clips/model/clip-view";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import type { VideoSource, VideoStatus } from "#/modules/video-records/model/video-status";

/** What the browser receives about a video. Dates travel as ISO strings. */
export interface VideoSummary {
    id: string;
    title: string;
    source: VideoSource;
    status: VideoStatus;
    progressPercent: number;
    errorMessage: string | null;
    isCancelling: boolean;
    durationSeconds: number | null;
    requestedClipCount: number;
    clipLength: ClipLength;
    readyClipCount: number;
    createdAt: string;
    /** When the current run was asked for; null for videos from before it was recorded. */
    processingStartedAt: string | null;
    /** The original YouTube link; null for uploaded files. */
    sourceUrl: string | null;
    thumbnailUrl: string | null;
    /** Where the original plays from; null until it is fully on disk. */
    originalFileUrl: string | null;
}

export interface VideoDetails {
    video: VideoSummary;
    clips: Array<ClipView>;
}

/** A ready clip shown outside its video, so it carries where it came from. */
export interface LibraryClip {
    clip: ClipView;
    videoId: string;
    videoTitle: string;
    createdAt: string;
}

export interface UsageSummary {
    videoCount: number;
    readyVideoCount: number;
    /** Length of every finished video added together. */
    processedSeconds: number;
    /** Moments Brilho picked, whether or not their clip rendered. */
    selectedClipCount: number;
    readyClipCount: number;
    clipsThisMonth: number;
    storage: StorageUsage;
    /** The disk the user is expected to stay within; the usage screen warns as it fills. */
    storageQuotaBytes: number;
}

/** Disk used by the user's videos, split by what the space holds. */
export interface StorageUsage {
    /** Null while a stored file has yet to be measured. */
    totalBytes: number | null;
    /** Rendered clips. */
    clipBytes: number | null;
    /** Everything else: the original video and its thumbnail (audio is deleted after use). */
    sourceBytes: number | null;
    /**
     * Uploads still on their way, and cancelled ones whose link may still write, until the link
     * expires. New uploads are refused against this space too, so the total counts it.
     */
    reservedBytes: number;
}
