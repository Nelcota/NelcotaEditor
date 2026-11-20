import { STAGE_CREW } from "#/modules/videos/stage-crew";
import type { ClipView } from "#/modules/videos/video-views";
import { ClipDownloadLink } from "#/modules/videos/ui/clip-download-link";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import { SCORE_SCALE } from "#/modules/videos/ui/clip-score";
import { CopyTitleButton } from "#/modules/videos/ui/copy-title-button";
import { OpenInStudioLink } from "#/modules/videos/ui/studio/open-in-studio-link";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { Mascot } from "#/shared/ui/mascot";
import { Progress } from "#/shared/ui/progress";
import type { ReactNode } from "react";

function toClipAnchorId(clipId: string): string {
    return `clip-${clipId}`;
}

/** Brilho picked the moments, so the score is presented as Brilho's. */
function BrilhoScore({ score }: { score: number }) {
    return (
        <div className="grid content-start gap-1.5">
            <p className="flex items-center gap-2 text-sm font-bold">
                <Mascot index={STAGE_CREW.selecting} className="size-6" />
                Nota do Brilho
            </p>
            <p className="text-3xl font-extrabold tabular-nums">
                {score}
                <span className="text-base font-semibold text-muted-foreground">
                    /{SCORE_SCALE}
                </span>
            </p>
            <Progress
                value={score}
                className="h-1.5 bg-muted"
                aria-label={`Nota ${score} de ${SCORE_SCALE}`}
            />
        </div>
    );
}

/** Only a rendered clip can be downloaded or posted, so nothing shows before that. */
function ClipActions({ clip, videoId }: { clip: ClipView; videoId: string }) {
    if (clip.downloadUrl === null) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
            <ClipDownloadLink clip={clip} label="Baixar" emphasis="secondary" />
            <OpenInStudioLink videoId={videoId} clipId={clip.id} />
            <CopyTitleButton title={clip.title} />
        </div>
    );
}

interface ClipRowProps {
    clip: ClipView;
    videoId: string;
    /** What comes first in the meta line: the rank inside a video, or the video it came from. */
    lead: ReactNode;
    isActive?: boolean;
    onActiveChange?: (isActive: boolean) => void;
}

function noActiveChange(): void {
    // Rows outside a video have no timeline to light up.
}

/** One clip per row: watch it, read why it was picked in full, download or copy its title. */
export function ClipRow({
    clip,
    videoId,
    lead,
    isActive = false,
    onActiveChange = noActiveChange,
}: ClipRowProps) {
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <article
            id={toClipAnchorId(clip.id)}
            onMouseEnter={() => onActiveChange(true)}
            onMouseLeave={() => onActiveChange(false)}
            className={cn(
                "grid scroll-mt-6 grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl border bg-popover p-4 transition-colors sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-x-5 sm:p-5 lg:grid-cols-[120px_minmax(0,1fr)_200px] sm:grid-rows-[auto_auto_1fr] lg:grid-rows-[auto_1fr] sm:[&>:first-child]:row-span-3 lg:[&>:first-child]:row-span-2",
                isActive === true && "border-primary",
            )}
        >
            <ClipPreview clip={clip} />
            <div className="grid min-w-0 content-start gap-2">
                <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[14px] font-bold text-muted-foreground tabular-nums">
                    {lead}
                    <span>
                        · {formatClock(clip.startSeconds)}–{formatClock(clip.endSeconds)} ·{" "}
                        {durationSeconds}s
                    </span>
                </p>
                <h3 className="text-lg leading-snug font-extrabold text-balance">{clip.title}</h3>
                {clip.reason.length > 0 && (
                    <p className="max-w-prose text-sm text-muted-foreground">{clip.reason}</p>
                )}
            </div>
            <div className="col-span-2 sm:col-span-1 sm:col-start-2">
                <ClipActions clip={clip} videoId={videoId} />
            </div>
            <div className="col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-3 lg:row-span-2 lg:row-start-1">
                <BrilhoScore score={clip.score} />
            </div>
        </article>
    );
}
