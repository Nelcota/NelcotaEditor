import CalendarIcon from "~icons/solar/calendar-linear";
import PlayCircleIcon from "~icons/solar/play-circle-linear";
import ScissorsIcon from "~icons/solar/scissors-linear";
import UploadIcon from "~icons/solar/upload-linear";
import { Link } from "@tanstack/react-router";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoSource } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { pluralize } from "#/modules/videos/ui/pluralize";
import { useVideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import {
    CancelledOverlay,
    FailedOverlay,
    WorkingOverlay,
} from "#/modules/videos/ui/video-card-overlay";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VideoRowMenu } from "#/modules/videos/ui/video-row-menu";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import { formatClock, formatDate } from "#/shared/ui/format";
import type { IconComponent } from "#/shared/ui/icon-component";

const BADGE_CLASS = "absolute rounded-md bg-black/65 px-1.5 py-0.5 text-xs font-bold text-white";

/** A frame of the video when there is one; its mascot, large, otherwise. */
function CardImage({ video }: { video: VideoSummary }) {
    const thumbnailUrl = video.thumbnailUrl;

    if (thumbnailUrl === null) {
        return (
            <span className="grid size-full place-items-center bg-secondary">
                <VideoMascot videoId={video.id} className="size-16" />
            </span>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
    );
}

const SOURCE_ICONS: Record<VideoSource, IconComponent> = {
    youtube: PlayCircleIcon,
    upload: UploadIcon,
};

const META_ITEM_CLASS = "inline-flex items-center gap-1";

/** Where it came from and when it was added; the clip count is on the frame already. */
function CardMeta({ video }: { video: VideoSummary }) {
    const SourceIcon = SOURCE_ICONS[video.source];

    return (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[14px] text-muted-foreground tabular-nums">
            <span className={META_ITEM_CLASS}>
                <SourceIcon aria-hidden="true" className="size-4" />
                {VIDEO_SOURCE_LABELS[video.source]}
            </span>
            <span className={META_ITEM_CLASS}>
                <CalendarIcon aria-hidden="true" className="size-4" />
                {formatDate(video.createdAt)}
            </span>
        </p>
    );
}

function ImageBadges({ video }: { video: VideoSummary }) {
    const durationSeconds = video.durationSeconds;
    const readyClipCount = video.readyClipCount;

    return (
        <>
            {/* Without a frame the mascot already fills the card. */}
            {video.thumbnailUrl !== null && (
                <span className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-black/55">
                    <VideoMascot videoId={video.id} className="size-6" />
                </span>
            )}
            {durationSeconds !== null && (
                <span className={`${BADGE_CLASS} bottom-2 left-2 tabular-nums`}>
                    {formatClock(durationSeconds)}
                </span>
            )}
            {video.status === "done" && (
                <span className={`${BADGE_CLASS} right-2 bottom-2 flex items-center gap-1`}>
                    <ScissorsIcon className="size-4" aria-hidden="true" />
                    {readyClipCount} {pluralize(readyClipCount, "corte", "cortes")}
                </span>
            )}
        </>
    );
}

/** One video in the gallery: the frame first, the crew on top of it while it is at work. */
export function VideoCard({ video }: { video: VideoSummary }) {
    const actions = useVideoRowActions(video.id);

    return (
        <li className="group relative grid content-start gap-2.5">
            <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
                <CardImage video={video} />
                <ImageBadges video={video} />
                {isVideoFinished(video.status) === false && <WorkingOverlay video={video} />}
                {video.status === "cancelled" && <CancelledOverlay />}
                {video.status === "failed" && (
                    <FailedOverlay
                        video={video}
                        onRetry={actions.resume}
                        isRetrying={actions.isPending}
                        retryError={actions.errorMessage}
                    />
                )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="grid min-w-0 gap-1">
                    <Link
                        to="/videos/$videoId"
                        params={{ videoId: video.id }}
                        title={video.title}
                        className="line-clamp-2 min-h-[2lh] rounded font-bold break-words underline-offset-4 outline-none group-hover:underline after:absolute after:inset-x-0 after:top-0 after:aspect-video after:rounded-2xl focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
                    >
                        {video.title}
                    </Link>
                    <CardMeta video={video} />
                </div>
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
