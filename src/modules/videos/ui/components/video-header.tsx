import CalendarIcon from "~icons/lucide/calendar";
import ClockIcon from "~icons/lucide/clock";
import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
import UploadIcon from "~icons/lucide/upload";
import ChevronLeftIcon from "~icons/lucide/chevron-left";
import { Link } from "@tanstack/react-router";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { VideoActionsMenu } from "#/modules/videos/ui/components/video-actions-menu";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/model/video-status-labels";
import { VideoStatusBadge } from "#/modules/videos/ui/components/video-status-badge";
import { cn } from "#/shared/ui/cn";
import { formatClock, formatDate } from "#/shared/ui/format";

const SECURE_URL_PREFIX = "https://";

/** Phones only: there is no sidebar, so this is the way back to the list. */
function BackToList() {
    return (
        <Link
            to="/videos"
            className="-ms-1 inline-flex h-10 w-fit items-center gap-1 rounded-xl pe-2 text-meta font-medium text-muted-foreground outline-none transition-[color,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] md:hidden"
        >
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
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
            className="inline-flex items-center gap-1.5 rounded underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
        >
            Abrir no YouTube
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
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
                    <ClockIcon className="size-4" aria-hidden="true" />
                    {formatClock(durationSeconds)}
                </span>
            )}
        </div>
    );
}

interface VideoHeaderProps {
    video: VideoSummary;
    /**
     * From lg the inspector beside the page names the video and holds its source and actions. The
     * title is then read out only, and the controls leave the page (display: none), so no focusable
     * element is ever visually hidden.
     */
    isInspectorShown: boolean;
    /**
     * The Studio needs the window's height: the title shrinks to one line and the meta, which the
     * other tabs show, steps aside.
     */
    isCompact: boolean;
}

export function VideoHeader({ video, isInspectorShown, isCompact }: VideoHeaderProps) {
    const inspectorOwnedClass = cn(isInspectorShown === true && "lg:hidden");

    return (
        <header className="grid gap-2">
            <BackToList />
            <div className="flex items-start gap-4">
                <div className="grid min-w-0 flex-1 gap-1.5">
                    <h1
                        className={cn(
                            "line-clamp-2 text-title font-semibold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]",
                            isCompact === true && "line-clamp-1 text-xl",
                            isInspectorShown === true && "lg:sr-only",
                        )}
                    >
                        {video.title}
                    </h1>
                    {isCompact === false && (
                        <div className={inspectorOwnedClass}>
                            <VideoMeta video={video} />
                        </div>
                    )}
                </div>
                <div className={cn("-mt-1", inspectorOwnedClass)}>
                    <VideoActionsMenu video={video} />
                </div>
            </div>
        </header>
    );
}
