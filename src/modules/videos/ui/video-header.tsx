import CalendarIcon from "~icons/solar/calendar-linear";
import ClockCircleIcon from "~icons/solar/clock-circle-linear";
import SquareArrowRightUpIcon from "~icons/solar/square-arrow-right-up-linear";
import UploadIcon from "~icons/solar/upload-linear";
import AltArrowRightIcon from "~icons/solar/alt-arrow-right-linear";
import { Link } from "@tanstack/react-router";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoActionsMenu } from "#/modules/videos/ui/video-actions-menu";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import { VideoStatusBadge } from "#/modules/videos/ui/video-status-badge";
import { formatClock, formatDate } from "#/shared/ui/format";

const SECURE_URL_PREFIX = "https://";

/** Where the page sits: back to the gallery, then this video. */
function Breadcrumb({ title }: { title: string }) {
    return (
        <nav aria-label="Você está em" className="text-meta text-muted-foreground">
            <ol className="flex min-w-0 items-center gap-1.5">
                <li>
                    <Link
                        to="/"
                        className="rounded underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring/70"
                    >
                        Vídeos
                    </Link>
                </li>
                <li aria-hidden="true">
                    <AltArrowRightIcon className="size-4" />
                </li>
                <li aria-current="page" className="min-w-0 truncate text-foreground">
                    {title}
                </li>
            </ol>
        </nav>
    );
}

/** YouTube videos link back to the original; uploaded files just say where they came from. */
function SourceLink({ video }: { video: VideoSummary }) {
    const sourceUrl = video.sourceUrl;

    if (sourceUrl === null || sourceUrl.startsWith(SECURE_URL_PREFIX) === false) {
        return (
            <span className="inline-flex items-center gap-1.5">
                <UploadIcon className="size-4" aria-hidden="true" />
                {VIDEO_SOURCE_LABELS[video.source]}
            </span>
        );
    }

    return (
        <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
        >
            Abrir no YouTube
            <SquareArrowRightUpIcon className="size-4" aria-hidden="true" />
        </a>
    );
}

/** Status (once finished), where it came from, when it was added and how long it is. */
function VideoMeta({ video }: { video: VideoSummary }) {
    const durationSeconds = video.durationSeconds;

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {/* While processing, the panel below already says the stage. */}
            {isVideoFinished(video.status) === true && <VideoStatusBadge status={video.status} />}
            <SourceLink video={video} />
            <span className="inline-flex items-center gap-1.5 tabular-nums">
                <CalendarIcon className="size-4" aria-hidden="true" />
                {formatDate(video.createdAt)}
            </span>
            {durationSeconds !== null && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <ClockCircleIcon className="size-4" aria-hidden="true" />
                    {formatClock(durationSeconds)}
                </span>
            )}
        </div>
    );
}

export function VideoHeader({ video }: { video: VideoSummary }) {
    return (
        <header className="grid gap-3">
            <Breadcrumb title={video.title} />
            <div className="flex items-center gap-4">
                <VideoMascot videoId={video.id} className="size-10 shrink-0 max-sm:hidden" />
                <div className="grid min-w-0 flex-1 gap-1.5">
                    <h1 className="line-clamp-2 text-2xl leading-tight font-semibold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                        {video.title}
                    </h1>
                    <VideoMeta video={video} />
                </div>
                <VideoActionsMenu video={video} />
            </div>
        </header>
    );
}
