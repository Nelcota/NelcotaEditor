import type { AspectRatio, CaptionStyle } from "#/modules/clips/clip-format";
import type { ClipStatus } from "#/modules/clips/clip-status";
import type { VideoSource, VideoStatus } from "#/modules/videos/video-status";

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

export interface ClipView {
    id: string;
    position: number;
    title: string;
    reason: string;
    startSeconds: number;
    endSeconds: number;
    score: number;
    status: ClipStatus;
    aspectRatio: AspectRatio;
    captionStyle: CaptionStyle;
    fileUrl: string | null;
    downloadUrl: string | null;
    /** Where anyone with the link can watch it; null while the clip is not shared. */
    sharePath: string | null;
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
    totalBytes: number;
    /** Rendered clips. */
    clipBytes: number;
    /** Everything else: the original video and its thumbnail (audio is deleted after use). */
    sourceBytes: number;
}
