import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { getVideoProgress } from "#/modules/videos/server/video-progress-functions";
import type { VideoProgress } from "#/modules/videos/server/video-progress-functions";
import type { VideoListPage } from "#/modules/videos/model/video-list-page";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import {
    mergeVideoProgress,
    writeVideoProgress,
} from "#/modules/videos/model/merge-video-progress";
import {
    PROGRESS_KEY_SEGMENT,
    VIDEOS_QUERY_KEY,
    VIDEO_LIST_QUERY_KEY,
    invalidateVideoQueries,
    pollWhileProcessing,
    workingVideosQueryOptions,
} from "#/modules/videos/model/video-queries";

function writeProgressIntoPages(
    pages: InfiniteData<VideoListPage> | undefined,
    progress: Array<VideoProgress>,
): InfiniteData<VideoListPage> | undefined {
    if (pages === undefined) {
        return undefined;
    }

    return {
        ...pages,
        pages: pages.pages.map((page) => ({
            ...page,
            items: writeVideoProgress(page.items, progress),
        })),
    };
}

/** Writes the polled numbers into the lists, or refreshes every video query when a stage changed. */
async function syncVideoLists(
    queryClient: QueryClient,
    watchedIds: Array<string>,
    progress: Array<VideoProgress>,
): Promise<void> {
    const workingQueryKey = workingVideosQueryOptions().queryKey;
    const working = queryClient.getQueryData(workingQueryKey);

    if (working === undefined) {
        return;
    }

    const merged = mergeVideoProgress(working, watchedIds, progress);

    if (merged === null) {
        // A new stage can change more than the list: ready clips, the space used, the open video.
        await invalidateVideoQueries(queryClient);
        return;
    }

    queryClient.setQueryData(workingQueryKey, merged);
    queryClient.setQueriesData<InfiniteData<VideoListPage>>(
        { queryKey: VIDEO_LIST_QUERY_KEY },
        (pages) => writeProgressIntoPages(pages, progress),
    );
}

function toProgress(video: VideoSummary): VideoProgress {
    return {
        id: video.id,
        title: video.title,
        status: video.status,
        progressPercent: video.progressPercent,
        isCancelling: video.isCancelling,
        readyClipCount: video.readyClipCount,
    };
}

/**
 * The last poll, finished videos included, plus the videos that started since: a video that
 * finishes leaves the watched list on the refetch its own poll causes, yet its "Pronto" must be heard.
 */
function combineProgress(
    polled: Array<VideoProgress>,
    watched: Array<VideoSummary>,
): Array<VideoProgress> {
    const polledIds = new Set(polled.map((entry) => entry.id));
    const started = watched.filter((video) => polledIds.has(video.id) === false);

    return [...polled, ...started.map(toProgress)];
}

/**
 * Polls the videos still in progress while any is, at the pace their stage calls for, and keeps
 * every list current. Returns the latest numbers, a finished video's last stage included.
 */
export function useVideoProgressWatch(): Array<VideoProgress> {
    const queryClient = useQueryClient();
    const workingQuery = useQuery(workingVideosQueryOptions());
    const watched = workingQuery.data ?? [];
    const watchedIds = watched.map((video) => video.id);
    const progressQuery = useQuery({
        // One key whatever is watched: a poll that finishes a video refetches the watched list
        // before it resolves, and a key made of the ids would store its result where no one looks.
        queryKey: [...VIDEOS_QUERY_KEY, PROGRESS_KEY_SEGMENT],
        queryFn: async (): Promise<Array<VideoProgress>> => {
            const progress = await getVideoProgress({ data: { videoIds: watchedIds } });
            await syncVideoLists(queryClient, watchedIds, progress);
            return progress;
        },
        enabled: watchedIds.length > 0,
        // The list just brought these numbers; the first poll waits one interval.
        initialData: () => watched.map(toProgress),
        initialDataUpdatedAt: workingQuery.dataUpdatedAt,
        staleTime: Number.POSITIVE_INFINITY,
        refetchInterval: pollWhileProcessing(watched.map((video) => video.status)),
    });

    return combineProgress(progressQuery.data ?? [], watched);
}
