import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { isVideoWorking } from "#/modules/video-records/video-status";
import { toCrewLine } from "#/modules/videos/crew-lines";
import { useVideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import type { VideoRowActions } from "#/modules/videos/ui/use-video-row-actions";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VideoRowMenu } from "#/modules/videos/ui/video-row-menu";
import { VideoRowStatus } from "#/modules/videos/ui/video-row-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { formatClock, formatShortDate } from "#/shared/ui/format";
import { pluralize } from "#/shared/ui/pluralize";
import { Progress } from "#/shared/ui/progress";

/** A frame of the video when there is one; its mascot on a sunken field otherwise. */
function RowThumbnail({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;
    // A frame that fails to load (deleted file, blocked host) falls back to the mascot too.
    const [hasFailed, setHasFailed] = useState(false);

    if (thumbnailUrl === null || hasFailed === true) {
        return (
            <span className="grid h-[45px] w-20 shrink-0 sm:h-[63px] sm:w-28 place-items-center rounded-lg bg-secondary">
                <VideoMascot videoId={video.id} className="size-7" />
            </span>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasFailed(true)}
            className="h-[45px] w-20 shrink-0 sm:h-[63px] sm:w-28 rounded-lg bg-secondary object-cover outline-1 -outline-offset-1 outline-solid outline-black/10 dark:outline-white/10"
        />
    );
}

/** "3 cortes · 13:00 · 20/11": what came out, how long it is, when it arrived. */
function describeDoneVideo(video: VideoSummary): string {
    const readyClipCount = video.readyClipCount;
    const durationSeconds = video.durationSeconds;
    const parts = [`${readyClipCount} ${pluralize(readyClipCount, "corte", "cortes")}`];

    if (durationSeconds !== null) {
        parts.push(formatClock(durationSeconds));
    }

    parts.push(formatShortDate(video.createdAt));

    return parts.join(" · ");
}

interface RowMetaProps {
    video: VideoSummary;
    titleId: string;
    actions: VideoRowActions;
}

/** Under the title: the facts when done, the way out of a failure, the crew's line while working. */
function RowMeta({ video, titleId, actions }: RowMetaProps): ReactNode {
    if (video.status === "done") {
        return (
            <p className="text-meta text-muted-foreground tabular-nums">
                {describeDoneVideo(video)}
            </p>
        );
    }

    if (video.status === "failed" || video.status === "cancelled") {
        return (
            <p className="relative z-10 text-xs text-muted-foreground">
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

    return <p className="text-xs text-primary-ink">{toCrewLine(video)}</p>;
}

/**
 * One video in the list card: 16px in on both sides, the thumbnail on the leading line and the
 * menu's glyph near the trailing one.
 */
export function VideoListRow({ video }: { video: VideoSummary }): ReactNode {
    const actions = useVideoRowActions(video.id);
    const titleId = useId();
    const progressPercent = video.progressPercent;

    return (
        <li className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-foreground/[0.03]">
            <RowThumbnail video={video} />
            <div className="grid min-w-0 flex-1 content-start gap-1">
                {/* The link covers the whole row; the menu and retry sit above it. */}
                <Link
                    id={titleId}
                    to="/videos/$videoId"
                    params={{ videoId: video.id }}
                    title={video.title}
                    className="line-clamp-2 rounded text-sm leading-snug font-medium break-words outline-none motion-safe:active:scale-[0.99] underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:after:ring-4 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                >
                    {video.title}
                </Link>
                <RowMeta video={video} titleId={titleId} actions={actions} />
                {isVideoWorking(video.status) === true && (
                    <Progress
                        value={progressPercent}
                        aria-label={`Progresso: ${progressPercent}%`}
                        className="mt-1 h-1"
                    />
                )}
            </div>
            <div className="relative z-10 -me-2">
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
