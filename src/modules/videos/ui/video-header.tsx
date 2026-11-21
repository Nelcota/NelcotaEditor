import CalendarIcon from "~icons/solar/calendar-linear";
import ClockCircleIcon from "~icons/solar/clock-circle-linear";
import SquareArrowRightUpIcon from "~icons/solar/square-arrow-right-up-linear";
import UploadIcon from "~icons/solar/upload-linear";
import AltArrowLeftIcon from "~icons/solar/alt-arrow-left-linear";
import { Link } from "@tanstack/react-router";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoActionsMenu } from "#/modules/videos/ui/video-actions-menu";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import { VideoStatusBadge } from "#/modules/videos/ui/video-status-badge";
import { cn } from "#/shared/ui/cn";
import { formatClock, formatDate } from "#/shared/ui/format";

const SECURE_URL_PREFIX = "https://";

/** Phones only: there is no sidebar, so this is the way back to the list. */
function BackToList() {
    return (
        <Link
            to="/"
            className="-ms-1 inline-flex h-10 w-fit items-center gap-1 rounded-xl pe-2 text-meta font-medium text-muted-foreground outline-none transition-[color,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] md:hidden"
        >
            <AltArrowLeftIcon aria-hidden="true" className="size-5" />
            Vídeos
        </Link>
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

interface VideoHeaderProps {
    video: VideoSummary;
    /** From lg the inspector beside the page already names the video, so the title is read out only. */
    isInspectorShown: boolean;
}

export function VideoHeader({ video, isInspectorShown }: VideoHeaderProps) {
    return (
        <header className="grid gap-2">
            <BackToList />
            <div
                className={cn("flex items-center gap-4", isInspectorShown === true && "lg:sr-only")}
            >
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
