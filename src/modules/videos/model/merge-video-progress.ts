import type { VideoProgress } from "#/modules/videos/server/video-progress-functions";
import type { VideoSummary } from "#/modules/videos/model/video-views";

function withProgress(video: VideoSummary, progress: VideoProgress | undefined): VideoSummary {
    if (progress === undefined) {
        return video;
    }

    if (
        progress.progressPercent === video.progressPercent &&
        progress.isCancelling === video.isCancelling &&
        progress.readyClipCount === video.readyClipCount
    ) {
        return video;
    }

    return {
        ...video,
        progressPercent: progress.progressPercent,
        isCancelling: progress.isCancelling,
        readyClipCount: progress.readyClipCount,
    };
}

/** The polled numbers written into any list of videos; the same list when nothing moved. */
export function writeVideoProgress(
    list: Array<VideoSummary>,
    progress: Array<VideoProgress>,
): Array<VideoSummary> {
    const progressById = new Map(progress.map((entry) => [entry.id, entry]));
    const merged = list.map((video) => withProgress(video, progressById.get(video.id)));

    if (merged.every((video, index) => video === list[index]) === true) {
        return list;
    }

    return merged;
}

/**
 * The watched list with the polled numbers written in, or null when it must be fetched again: a
 * video finished, moved to another stage (its thumbnail, original and counts change with it) or is
 * gone.
 */
export function mergeVideoProgress(
    list: Array<VideoSummary>,
    watchedIds: Array<string>,
    progress: Array<VideoProgress>,
): Array<VideoSummary> | null {
    const progressById = new Map(progress.map((entry) => [entry.id, entry]));
    const listById = new Map(list.map((video) => [video.id, video]));

    if (
        watchedIds.some(
            (videoId) => progressById.get(videoId)?.status !== listById.get(videoId)?.status,
        ) === true
    ) {
        return null;
    }

    return writeVideoProgress(list, progress);
}
