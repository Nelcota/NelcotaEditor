import FileVideoIcon from "~icons/lucide/file-video";
import ScissorsIcon from "~icons/lucide/scissors";
import YoutubeIcon from "~icons/lucide/youtube";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { toCrewLine } from "#/modules/videos/model/crew-lines";
import { useVideoRowActions } from "#/modules/videos/ui/hooks/use-video-row-actions";
import type { VideoRowActions } from "#/modules/videos/ui/hooks/use-video-row-actions";
import { VideoMascot } from "#/modules/videos/ui/components/video-mascot";
import { VideoRowMenu } from "#/modules/videos/ui/components/video-row-menu";
import { VideoRowStatus } from "#/modules/videos/ui/components/video-row-status";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/model/video-status-labels";
import {
    STATUS_BAR_CLASSES,
    STATUS_PILL_CLASSES,
    toTableStatus,
} from "#/modules/videos/ui/components/video-table-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { cn } from "#/shared/ui/cn";
import { formatClock, formatShortDate } from "#/shared/ui/format";

/** Shared by the head and every row, so the columns line up. */
export const VIDEO_TABLE_COLUMNS =
    "@4xl:grid-cols-[minmax(0,2.4fr)_8.5rem_4rem_4.5rem_minmax(0,1.5fr)_5rem_2.5rem]";

const PERCENT = 100;

/** A frame of the video when there is one; its mascot on a sunken field otherwise. */
function RowThumbnail({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;
    // A frame that fails to load (deleted file, blocked host) falls back to the mascot too.
    const [hasFailed, setHasFailed] = useState(false);

    if (thumbnailUrl === null || hasFailed === true) {
        return (
            <span className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-secondary">
                <VideoMascot videoId={video.id} className="size-6" />
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
            className="h-10 w-16 shrink-0 rounded-lg bg-secondary object-cover outline-1 -outline-offset-1 outline-foreground/10 outline-solid"
        />
    );
}

/** "YouTube · 16:51": where it came from and how long it is. */
function describeSource(video: VideoSummary): string {
    const durationSeconds = video.durationSeconds;
    const sourceLabel = VIDEO_SOURCE_LABELS[video.source];

    if (durationSeconds === null) {
        return sourceLabel;
    }

    return `${sourceLabel} · ${formatClock(durationSeconds)}`;
}

interface RowMetaProps {
    video: VideoSummary;
    titleId: string;
    actions: VideoRowActions;
}

/** Under the title: the source when done, the way out of a failure, the crew's line while working. */
function RowStatusLine({ video, titleId, actions }: RowMetaProps): ReactNode {
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

    if (video.status === "done") {
        return (
            <p className="truncate text-xs text-muted-foreground tabular-nums">
                {describeSource(video)}
            </p>
        );
    }

    return <p className="truncate text-xs text-primary-ink">{toCrewLine(video)}</p>;
}

/**
 * The status line, plus why a resume or cancel from the menu did not go through. A failed row
 * already shows that error in its own line; every other status needs it here.
 */
function RowMeta({ video, titleId, actions }: RowMetaProps): ReactNode {
    const errorMessage = actions.errorMessage;

    return (
        <>
            <RowStatusLine video={video} titleId={titleId} actions={actions} />
            {errorMessage !== null && video.status !== "failed" && (
                <p role="alert" className="text-xs text-destructive [overflow-wrap:anywhere]">
                    {errorMessage}
                </p>
            )}
        </>
    );
}

function StatusPill({ video }: { video: VideoSummary }): ReactNode {
    const status = toTableStatus(video.status);
    const Icon = status.icon;

    return (
        <span
            className={cn(
                "inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap [&>svg]:size-3.5",
                STATUS_PILL_CLASSES[status.tone],
            )}
        >
            <Icon
                aria-hidden="true"
                className={cn(status.tone === "working" && "motion-safe:animate-spin")}
            />
            {status.label}
        </span>
    );
}

function SourceIcon({ video }: { video: VideoSummary }): ReactNode {
    const label = VIDEO_SOURCE_LABELS[video.source];

    if (video.source === "youtube") {
        return (
            <span
                title={label}
                className="grid size-7 place-items-center rounded-full bg-[#e5312c] text-white"
            >
                <YoutubeIcon aria-hidden="true" className="size-4" />
                <span className="sr-only">{label}</span>
            </span>
        );
    }

    return (
        <span
            title={label}
            className="grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground"
        >
            <FileVideoIcon aria-hidden="true" className="size-4" />
            <span className="sr-only">{label}</span>
        </span>
    );
}

function ClipCount({ video }: { video: VideoSummary }): ReactNode {
    const readyClipCount = video.readyClipCount;

    return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
            <ScissorsIcon aria-hidden="true" className="size-4 text-success" />
            {readyClipCount}
            <span className="sr-only"> cortes prontos</span>
        </span>
    );
}

/** The stage in words, the percent and the bar, coloured by how it is going. */
function ProgressCell({ video }: { video: VideoSummary }): ReactNode {
    const status = toTableStatus(video.status);
    let percent = Math.min(PERCENT, Math.max(0, video.progressPercent));

    if (video.status === "done") {
        percent = PERCENT;
    }

    return (
        <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-semibold">{status.stageLabel}</span>
                <span className="text-muted-foreground tabular-nums">{percent}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                <div
                    className={cn("h-full rounded-full", STATUS_BAR_CLASSES[status.tone])}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

/**
 * One video as a table row (the reference's campaigns table). From a wide table (56rem) every fact has its column;
 * narrower screens keep the thumbnail, the title with its line and the status.
 */
export function VideoListRow({ video }: { video: VideoSummary }): ReactNode {
    const actions = useVideoRowActions(video.id);
    const titleId = useId();

    return (
        <li
            className={cn(
                "group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-foreground/[0.03]",
                VIDEO_TABLE_COLUMNS,
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <RowThumbnail video={video} />
                <div className="grid min-w-0 gap-0.5">
                    {/* The link covers the whole row; the menu and retry sit above it. */}
                    <Link
                        id={titleId}
                        to="/videos/$videoId"
                        params={{ videoId: video.id }}
                        title={video.title}
                        className="truncate rounded text-sm font-semibold outline-none underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:after:ring-4 focus-visible:after:ring-ring focus-visible:after:ring-inset motion-safe:active:scale-[0.99]"
                    >
                        {video.title}
                    </Link>
                    <RowMeta video={video} titleId={titleId} actions={actions} />
                </div>
            </div>
            <div className="@max-4xl:hidden">
                <StatusPill video={video} />
            </div>
            <div className="@max-4xl:hidden">
                <SourceIcon video={video} />
            </div>
            <div className="@max-4xl:hidden">
                <ClipCount video={video} />
            </div>
            <div className="@max-4xl:hidden">
                <ProgressCell video={video} />
            </div>
            <span className="text-sm text-muted-foreground tabular-nums @max-4xl:hidden">
                {formatShortDate(video.createdAt)}
            </span>
            <div className="relative z-10 -me-2 justify-self-end">
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
