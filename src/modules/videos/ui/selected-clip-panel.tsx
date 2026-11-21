import { STAGE_CREW } from "#/modules/videos/stage-crew";
import type { ClipView } from "#/modules/clips/clip-view";
import { ClipDownloadLink } from "#/modules/videos/ui/clip-download-link";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import { SCORE_SCALE } from "#/modules/videos/ui/clip-score";
import { CopyTitleButton } from "#/modules/videos/ui/copy-title-button";
import { RetryClipButton } from "#/modules/videos/ui/retry-clip-button";
import { ShareClipButton } from "#/modules/videos/ui/share-clip-button";
import { OpenInStudioLink } from "#/modules/videos/ui/open-in-studio-link";
import { formatClock } from "#/shared/ui/format";
import { Mascot } from "#/shared/ui/mascot";

/** Brilho picked the moment, so the score and the reason are presented as Brilho's. */
function BrilhoReason({ clip }: { clip: ClipView }) {
    return (
        <div className="flex gap-3 rounded-xl bg-muted p-3 text-sm">
            <Mascot index={STAGE_CREW.selecting} className="size-7 shrink-0" />
            <p className="max-w-prose">
                <span className="font-semibold">
                    Brilho deu {clip.score}/{SCORE_SCALE}
                </span>
                {clip.reason.length > 0 && (
                    <span className="text-muted-foreground">: {clip.reason}</span>
                )}
            </p>
        </div>
    );
}

interface SelectedClipPanelProps {
    videoId: string;
    clip: ClipView;
    rank: number;
    total: number;
    /** Whether the video is finished, so a failed clip can go back to the queue. */
    canRetry: boolean;
}

function ClipActions({ videoId, clip, canRetry }: Omit<SelectedClipPanelProps, "rank" | "total">) {
    const isBusy = canRetry === false;

    if (clip.status === "failed") {
        return (
            <>
                <RetryClipButton videoId={videoId} clipId={clip.id} isDisabled={isBusy} />
                <OpenInStudioLink videoId={videoId} clipId={clip.id} />
            </>
        );
    }

    return (
        <>
            <ClipDownloadLink clip={clip} label="Baixar corte" />
            <OpenInStudioLink videoId={videoId} clipId={clip.id} />
            <ShareClipButton videoId={videoId} clip={clip} />
            <CopyTitleButton title={clip.title} />
        </>
    );
}

/** The clip being watched, playing at its real shape, why Brilho chose it and what to do with it. */
export function SelectedClipPanel({
    videoId,
    clip,
    rank,
    total,
    canRetry,
}: SelectedClipPanelProps) {
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <section
            aria-labelledby="selected-clip-title"
            aria-live="polite"
            className="grid gap-4 border-t p-4 sm:p-5"
        >
            <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[148px_minmax(0,1fr)]">
                <ClipPreview key={clip.id} clip={clip} />
                <div className="grid min-w-0 content-start gap-2">
                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-meta text-muted-foreground tabular-nums">
                        <span className="whitespace-nowrap">
                            Corte {rank} de {total}
                        </span>
                        <span className="whitespace-nowrap">
                            {formatClock(clip.startSeconds)} a {formatClock(clip.endSeconds)}
                        </span>
                        <span className="whitespace-nowrap">{durationSeconds}s</span>
                    </p>
                    <h2
                        id="selected-clip-title"
                        className="text-lg leading-snug font-semibold text-balance [overflow-wrap:anywhere]"
                    >
                        {clip.title}
                    </h2>
                </div>
            </div>
            <BrilhoReason clip={clip} />
            <div className="grid grid-cols-2 gap-2 [&>*]:w-full [&>*:first-child]:col-span-2">
                <ClipActions videoId={videoId} clip={clip} canRetry={canRetry} />
            </div>
        </section>
    );
}
