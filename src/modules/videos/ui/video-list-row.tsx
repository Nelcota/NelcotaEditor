import { Link } from "@tanstack/react-router";
import { useId } from "react";
import type { ReactNode } from "react";
import { useVideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VideoRowMenu } from "#/modules/videos/ui/video-row-menu";
import { VideoRowStatus } from "#/modules/videos/ui/video-row-status";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import type { VideoSummary } from "#/modules/videos/video-views";
import { formatClock, formatDate } from "#/shared/ui/format";

/** A frame of the video when there is one; its mascot otherwise. */
function RowThumbnail({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;

    if (thumbnailUrl === null) {
        return (
            <span className="grid aspect-video w-full place-items-center rounded-lg bg-secondary">
                <VideoMascot videoId={video.id} className="size-8" />
            </span>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="aspect-video w-full rounded-lg object-cover"
        />
    );
}

/** One video per line: a small frame, the title, where it stands and its menu. */
export function VideoListRow({ video }: { video: VideoSummary }): ReactNode {
    const actions = useVideoRowActions(video.id);
    const titleId = useId();
    const durationSeconds = video.durationSeconds;

    return (
        // On phones the title takes the menu's column and the meta line runs under the frame, with
        // the menu at its end: beside a frame and a menu the title had 88px at 320px.
        <li className="group relative grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b py-3 last:border-b-0 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-y-0">
            <RowThumbnail video={video} />
            <div className="contents min-w-0 gap-1 sm:grid">
                {/* The link covers the whole row; the menu and retry sit above it. */}
                <Link
                    id={titleId}
                    to="/videos/$videoId"
                    params={{ videoId: video.id }}
                    title={video.title}
                    className="line-clamp-2 rounded font-bold break-words underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 focus-visible:ring-4 focus-visible:ring-ring/70 max-sm:col-span-2"
                >
                    {video.title}
                </Link>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-muted-foreground tabular-nums max-sm:col-span-2">
                    <VideoRowStatus
                        video={video}
                        titleId={titleId}
                        onRetry={actions.resume}
                        isRetrying={actions.isPending}
                        retryError={actions.errorMessage}
                    />
                    <span>{VIDEO_SOURCE_LABELS[video.source]}</span>
                    <span>{formatDate(video.createdAt)}</span>
                    {durationSeconds !== null && <span>{formatClock(durationSeconds)}</span>}
                </p>
            </div>
            <div className="relative z-10">
                <VideoRowMenu
                    video={video}
                    onResume={actions.resume}
                    onCancel={actions.cancel}
                    isPending={actions.isPending}
                />
            </div>
        </li>
    );
}
