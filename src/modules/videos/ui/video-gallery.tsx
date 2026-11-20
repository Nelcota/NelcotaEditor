import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoCard } from "#/modules/videos/ui/video-card";
import { VideoPager } from "#/modules/videos/ui/video-pager";
import type { VideoPagerProps } from "#/modules/videos/ui/video-pager";

interface VideoGalleryProps extends VideoPagerProps {
    videos: Array<VideoSummary>;
}

/** Big cards, as many per row as the panel fits: one on phones, up to three on wide screens. */
export function VideoGallery({ videos, ...pager }: VideoGalleryProps) {
    return (
        <div className="@container grid gap-4">
            <ul
                aria-label="Seus vídeos"
                className="grid grid-cols-1 gap-x-5 gap-y-7 @xl:grid-cols-2 @4xl:grid-cols-3"
            >
                {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </ul>
            <VideoPager {...pager} />
        </div>
    );
}
