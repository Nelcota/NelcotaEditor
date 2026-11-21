import { useState } from "react";
import type { ReactNode } from "react";
import type { VideoStatus } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoListRow } from "#/modules/videos/ui/video-list-row";
import { VideoPager } from "#/modules/videos/ui/video-pager";
import type { VideoPagerProps } from "#/modules/videos/ui/video-pager";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/ui/video-status-labels";

type StatusById = ReadonlyMap<string, VideoStatus>;

function toStatusById(videos: Array<VideoSummary>): StatusById {
    return new Map(videos.map((video) => [video.id, video.status]));
}

/** Only videos seen before count: a page change or a new upload is not a stage change. */
function describeStageChanges(previous: StatusById, videos: Array<VideoSummary>): string {
    const changedVideos = videos.filter((video) => {
        const previousStatus = previous.get(video.id);

        return previousStatus !== undefined && previousStatus !== video.status;
    });

    return changedVideos
        .map((video) => `${video.title}: ${VIDEO_STATUS_LABELS[video.status]}`)
        .join(". ");
}

/**
 * One sentence per stage change, so a screen reader hears "Pronto" once instead of every poll's
 * progress on every card.
 */
function useStageAnnouncement(videos: Array<VideoSummary>): string {
    const [statusById, setStatusById] = useState<StatusById>(() => toStatusById(videos));
    const [announcement, setAnnouncement] = useState("");

    // Adjusting state while rendering (React's documented pattern) avoids an extra effect pass.
    if (videos.some((video) => statusById.get(video.id) !== video.status) === true) {
        const changes = describeStageChanges(statusById, videos);
        setStatusById(toStatusById(videos));

        if (changes.length > 0) {
            setAnnouncement(changes);
        }
    }

    return announcement;
}

interface VideoGalleryProps extends VideoPagerProps {
    videos: Array<VideoSummary>;
}

/** One line per video in a single bordered list, so many videos fit on one screen. */
export function VideoGallery({ videos, ...pager }: VideoGalleryProps): ReactNode {
    const announcement = useStageAnnouncement(videos);

    return (
        <div className="grid gap-4">
            <p role="status" className="sr-only">
                {announcement}
            </p>
            <ul aria-label="Seus vídeos" className="rounded-2xl border bg-popover px-4 sm:px-5">
                {videos.map((video) => (
                    <VideoListRow key={video.id} video={video} />
                ))}
            </ul>
            <VideoPager {...pager} />
        </div>
    );
}
