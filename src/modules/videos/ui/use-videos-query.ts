import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, UseQueryResult } from "@tanstack/react-query";
import {
    MAX_WATCHED_VIDEOS,
    getVideoProgress,
} from "#/modules/videos/server/video-progress-functions";
import type { VideoProgress } from "#/modules/videos/server/video-progress-functions";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { mergeVideoProgress } from "#/modules/videos/ui/merge-video-progress";
import {
    VIDEOS_QUERY_KEY,
    pollWhileProcessing,
    videosQueryOptions,
} from "#/modules/videos/ui/video-queries";

const PROGRESS_KEY_SEGMENT = "progress";

/** Writes the polled numbers into the list, or refetches the list when a video changed stage. */
async function syncVideoList(
    queryClient: QueryClient,
    watchedIds: Array<string>,
    progress: Array<VideoProgress>,
): Promise<void> {
    const listQueryKey = videosQueryOptions().queryKey;
    const list = queryClient.getQueryData(listQueryKey);

    if (list === undefined) {
        return;
    }

    const merged = mergeVideoProgress(list, watchedIds, progress);

    if (merged === null) {
        await queryClient.invalidateQueries({ queryKey: listQueryKey, exact: true });
        return;
    }

    queryClient.setQueryData(listQueryKey, merged);
}

function toProgress(video: VideoSummary): VideoProgress {
    return {
        id: video.id,
        status: video.status,
        progressPercent: video.progressPercent,
        isCancelling: video.isCancelling,
    };
}

/** Polls only the videos still in progress while any is, at the pace their stage calls for. */
function useVideoProgressPolling(listQuery: UseQueryResult<Array<VideoSummary>>): void {
    const queryClient = useQueryClient();
    const watched = (listQuery.data ?? [])
        .filter((video) => isVideoFinished(video.status) === false)
        .slice(0, MAX_WATCHED_VIDEOS);
    const watchedIds = watched.map((video) => video.id);

    useQuery({
        queryKey: [...VIDEOS_QUERY_KEY, PROGRESS_KEY_SEGMENT, ...watchedIds],
        queryFn: async (): Promise<Array<VideoProgress>> => {
            const progress = await getVideoProgress({ data: { videoIds: watchedIds } });
            await syncVideoList(queryClient, watchedIds, progress);
            return progress;
        },
        enabled: watchedIds.length > 0,
        // The list just brought these numbers; the first poll waits one interval.
        initialData: () => watched.map(toProgress),
        initialDataUpdatedAt: listQuery.dataUpdatedAt,
        staleTime: Number.POSITIVE_INFINITY,
        refetchInterval: pollWhileProcessing(watched.map((video) => video.status)),
    });
}

/** The user's videos, kept current while any of them is processing. */
export function useVideosQuery(): UseQueryResult<Array<VideoSummary>> {
    const listQuery = useQuery(videosQueryOptions());
    useVideoProgressPolling(listQuery);

    return listQuery;
}
