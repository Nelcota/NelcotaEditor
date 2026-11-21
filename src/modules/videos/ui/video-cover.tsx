import type { ReactNode } from "react";
import { isVideoWorking } from "#/modules/video-records/video-status";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/ui/video-status-labels";
import type { VideoSummary } from "#/modules/videos/video-views";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { pluralize } from "#/shared/ui/pluralize";
import { Progress } from "#/shared/ui/progress";

const PILL_CLASS =
    "absolute top-2.5 start-2.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-background/95 px-2.5 text-xs font-medium shadow-sm";

/** The short state on the cover: the clip count when done, the stage otherwise. */
function StatePill({ video }: { video: VideoSummary }): ReactNode {
    const readyClipCount = video.readyClipCount;

    if (video.status === "done") {
        return (
            <span className={cn(PILL_CLASS, "text-success")}>
                {readyClipCount} {pluralize(readyClipCount, "corte", "cortes")}
            </span>
        );
    }

    if (video.status === "failed") {
        return <span className={cn(PILL_CLASS, "text-destructive")}>Falhou</span>;
    }

    if (video.status === "cancelled") {
        return <span className={cn(PILL_CLASS, "text-muted-foreground")}>Cancelado</span>;
    }

    return (
        <span className={cn(PILL_CLASS, "text-primary-ink")}>
            <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
            {VIDEO_STATUS_LABELS[video.status]}
        </span>
    );
}

/** A frame of the video when there is one; its mascot on a sunken field otherwise. */
function CoverImage({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;

    if (thumbnailUrl === null) {
        return (
            <span className="grid size-full place-items-center">
                <VideoMascot videoId={video.id} className="size-12" />
            </span>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover transition-[scale] duration-300 motion-safe:group-hover:scale-[1.02]"
        />
    );
}

/** The 16:9 cover of a gallery card: frame, state, duration and, while working, the progress. */
export function VideoCover({ video }: { video: VideoSummary }): ReactNode {
    const durationSeconds = video.durationSeconds;
    const progressPercent = video.progressPercent;

    return (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
            <CoverImage video={video} />
            <StatePill video={video} />
            {durationSeconds !== null && (
                <span className="absolute end-2.5 bottom-2.5 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-xs font-medium text-white tabular-nums">
                    {formatClock(durationSeconds)}
                </span>
            )}
            {isVideoWorking(video.status) === true && (
                <Progress
                    value={progressPercent}
                    aria-label={`Progresso: ${progressPercent}%`}
                    className="absolute inset-x-0 bottom-0 h-1 rounded-none bg-white/40"
                />
            )}
        </div>
    );
}
