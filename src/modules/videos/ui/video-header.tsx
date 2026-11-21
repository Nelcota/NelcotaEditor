import CalendarIcon from "~icons/solar/calendar-linear";
import ClockCircleIcon from "~icons/solar/clock-circle-linear";
import SquareArrowRightUpIcon from "~icons/solar/square-arrow-right-up-linear";
import UploadIcon from "~icons/solar/upload-linear";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoActionsMenu } from "#/modules/videos/ui/video-actions-menu";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import { VideoStatusBadge } from "#/modules/videos/ui/video-status-badge";
import { cn } from "#/shared/ui/cn";
import { formatClock, formatDate } from "#/shared/ui/format";

const SECURE_URL_PREFIX = "https://";

/** A frame of the video when there is one; the video's mascot otherwise. */
function VideoThumbnail({ video }: { video: VideoSummary }) {
    const thumbnailUrl = video.thumbnailUrl;

    if (thumbnailUrl === null) {
        return <VideoMascot videoId={video.id} className="size-14" />;
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            referrerPolicy="no-referrer"
            className={cn(
                "aspect-video w-full shrink-0 rounded-xl bg-muted object-cover sm:w-44",
                // On phones the original plays full width right below; the same frame twice is noise.
                video.originalFileUrl !== null && "hidden sm:block",
            )}
        />
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
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <VideoThumbnail video={video} />
            <div className="grid min-w-0 flex-1 gap-2.5">
                <div className="flex items-start gap-3">
                    <h1 className="min-w-0 flex-1 line-clamp-2 text-2xl leading-tight font-extrabold tracking-tight text-balance [overflow-wrap:anywhere] sm:text-[30px]">
                        {video.title}
                    </h1>
                    <VideoActionsMenu video={video} />
                </div>
                <VideoMeta video={video} />
            </div>
        </header>
    );
}
