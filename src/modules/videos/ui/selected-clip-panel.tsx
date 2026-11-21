import { STAGE_CREW } from "#/modules/videos/stage-crew";
import type { ClipView } from "#/modules/videos/video-views";
import { ClipDownloadLink } from "#/modules/videos/ui/clip-download-link";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import { SCORE_SCALE } from "#/modules/videos/ui/clip-score";
import { CopyTitleButton } from "#/modules/videos/ui/copy-title-button";
import { RetryClipButton } from "#/modules/videos/ui/retry-clip-button";
import { ShareClipButton } from "#/modules/videos/ui/share-clip-button";
import { OpenInStudioLink } from "#/modules/videos/ui/studio/open-in-studio-link";
import { formatClock } from "#/shared/ui/format";
import { Mascot } from "#/shared/ui/mascot";

/** Brilho picked the moment, so the score and the reason are presented as Brilho's. */
function BrilhoReason({ clip }: { clip: ClipView }) {
    return (
        <div className="flex gap-3 rounded-xl border bg-background/40 p-3 text-sm">
            <Mascot index={STAGE_CREW.selecting} className="size-7 shrink-0" />
            <p className="max-w-prose">
                <span className="font-bold">
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

/** The clip being watched: why Brilho chose it and what to do with it. The phone shows it here too. */
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
            className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-2xl border bg-popover p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
        >
            <div className="lg:hidden">
                <ClipPreview key={clip.id} clip={clip} />
            </div>
            <div className="grid min-w-0 content-start gap-2">
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-meta font-bold text-muted-foreground tabular-nums">
                    <span className="whitespace-nowrap">
                        CORTE {rank} DE {total}
                    </span>
                    <span className="whitespace-nowrap">
                        {formatClock(clip.startSeconds)} a {formatClock(clip.endSeconds)}
                    </span>
                    <span className="whitespace-nowrap">{durationSeconds}s</span>
                </p>
                <h2
                    id="selected-clip-title"
                    className="text-lg leading-snug font-extrabold text-balance sm:text-xl"
                >
                    {clip.title}
                </h2>
                <div className="hidden sm:block">
                    <BrilhoReason clip={clip} />
                </div>
            </div>
            <div className="col-span-2 grid gap-3 sm:hidden">
                <BrilhoReason clip={clip} />
            </div>
            <div className="col-span-2 flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none lg:col-span-1 lg:flex-col lg:[&>*]:w-full">
                <ClipActions videoId={videoId} clip={clip} canRetry={canRetry} />
            </div>
        </section>
    );
}
