import ClockIcon from "~icons/lucide/clock";
import FilmIcon from "~icons/lucide/film";
import ScissorsIcon from "~icons/lucide/scissors";
import YoutubeIcon from "~icons/lucide/youtube";
import type { ReactNode } from "react";
import { CLIP_LENGTH_LABELS } from "#/modules/preferences/model/preferences";
import { VideoMascot } from "#/modules/videos/ui/components/video-mascot";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/model/video-status-labels";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { formatClock } from "#/shared/ui/format";
import { pluralize } from "#/shared/ui/pluralize";

const TAG_CLASS =
    "inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 text-xs font-semibold text-primary-ink [&>svg]:size-3.5";

/** The video as the reference's message bubble: its frame, its title and where it came from. */
function VideoBubble({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;
    const durationSeconds = video.durationSeconds;
    let sourceLine = VIDEO_SOURCE_LABELS[video.source];

    if (durationSeconds !== null) {
        sourceLine = `${sourceLine} · ${formatClock(durationSeconds)}`;
    }

    return (
        <div className="flex max-w-md items-center gap-3 justify-self-end rounded-2xl bg-secondary px-3 py-2.5">
            {thumbnailUrl === null && (
                <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md bg-card">
                    <VideoMascot videoId={video.id} className="size-6" />
                </span>
            )}
            {thumbnailUrl !== null && (
                <img
                    src={thumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-10 w-16 shrink-0 rounded-md object-cover"
                />
            )}
            <div className="grid min-w-0">
                <span className="truncate text-sm font-medium">{video.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{sourceLine}</span>
            </div>
        </div>
    );
}

/**
 * Over a finished video's clips, the reference's answer: the video as a bubble, one sentence on
 * what came out, and the settings it used as tags.
 */
export function VideoResultSummary({ video }: { video: VideoSummary }): ReactNode {
    const readyClipCount = video.readyClipCount;

    if (video.status !== "done") {
        return null;
    }

    return (
        <section aria-label="Resumo do vídeo" className="grid gap-3">
            <VideoBubble video={video} />
            <p className="text-sm">
                Separei {readyClipCount} {pluralize(readyClipCount, "momento", "melhores momentos")}{" "}
                do vídeo, já em 9:16 e com legenda.
            </p>
            <ul aria-label="Como foi cortado" className="flex flex-wrap gap-1.5">
                <li className={TAG_CLASS}>
                    <ScissorsIcon aria-hidden="true" />
                    {readyClipCount} {pluralize(readyClipCount, "corte", "cortes")}
                </li>
                <li className={TAG_CLASS}>
                    <ClockIcon aria-hidden="true" />
                    Duração: {CLIP_LENGTH_LABELS[video.clipLength]}
                </li>
                <li className={TAG_CLASS}>
                    {video.source === "youtube" && <YoutubeIcon aria-hidden="true" />}
                    {video.source === "upload" && <FilmIcon aria-hidden="true" />}
                    {VIDEO_SOURCE_LABELS[video.source]}
                </li>
            </ul>
        </section>
    );
}
