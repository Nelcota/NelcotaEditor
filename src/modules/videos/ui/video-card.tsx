import { Link } from "@tanstack/react-router";
import { useId } from "react";
import type { ReactNode } from "react";
import { toCrewLine } from "#/modules/videos/crew-lines";
import { useVideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import type { VideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import { VideoCover } from "#/modules/videos/ui/video-cover";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VideoRowMenu } from "#/modules/videos/ui/video-row-menu";
import { VideoRowStatus } from "#/modules/videos/ui/video-row-status";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import type { VideoSummary } from "#/modules/videos/video-views";
import { formatDate } from "#/shared/ui/format";

interface CardMetaProps {
    video: VideoSummary;
    titleId: string;
    actions: VideoRowActions;
}

/** Under the title: where it came from when done, the crew's line while working, the way out of a failure. */
function CardMeta({ video, titleId, actions }: CardMetaProps): ReactNode {
    if (video.status === "done") {
        return (
            <p className="text-meta text-muted-foreground">
                {VIDEO_SOURCE_LABELS[video.source]} · {formatDate(video.createdAt)}
            </p>
        );
    }

    if (video.status === "failed" || video.status === "cancelled") {
        return (
            <p className="text-meta text-muted-foreground">
                <VideoRowStatus
                    video={video}
                    titleId={titleId}
                    onRetry={actions.resume}
                    isRetrying={actions.isPending}
                    retryError={actions.errorMessage}
                />
            </p>
        );
    }

    return <p className="text-meta text-muted-foreground">{toCrewLine(video)}</p>;
}

/** One video in the gallery: the cover with its state, then the mascot, title and menu. */
export function VideoCard({ video }: { video: VideoSummary }): ReactNode {
    const actions = useVideoRowActions(video.id);
    const titleId = useId();

    return (
        <li className="group relative grid content-start gap-3">
            <VideoCover video={video} />
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3">
                <VideoMascot videoId={video.id} className="mt-0.5 size-6" />
                <div className="grid min-w-0 gap-1">
                    {/* The link covers the whole card; the menu and retry sit above it. */}
                    <Link
                        id={titleId}
                        to="/videos/$videoId"
                        params={{ videoId: video.id }}
                        title={video.title}
                        className="line-clamp-2 rounded font-medium break-words underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-ring/70"
                    >
                        {video.title}
                    </Link>
                    <CardMeta video={video} titleId={titleId} actions={actions} />
                </div>
                <div className="relative z-10 -me-2 -mt-2">
                    <VideoRowMenu
                        video={video}
                        onResume={actions.resume}
                        onCancel={actions.cancel}
                        isPending={actions.isPending}
                    />
                </div>
            </div>
        </li>
    );
}
