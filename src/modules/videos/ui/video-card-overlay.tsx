import RestartIcon from "~icons/solar/restart-linear";
import type { ReactNode } from "react";
import { toCrewLine } from "#/modules/videos/crew-lines";
import type { VideoSummary } from "#/modules/videos/video-views";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { useProcessingTimeLeft } from "#/modules/videos/ui/use-processing-time-left";
import { Button } from "#/shared/ui/button";
import { formatTimeLeft } from "#/shared/ui/format";
import { cn } from "#/shared/ui/cn";
import { Progress } from "#/shared/ui/progress";

const FALLBACK_FAILURE_MESSAGE =
    "Guarda encontrou um problema. Tente de novo; se repetir, envie o vídeo outra vez.";

const OVERLAY_CLASS =
    "pointer-events-none absolute inset-0 grid content-center justify-items-center gap-2 p-4 text-center text-sm text-white";

function describeProgress(progressPercent: number, secondsLeft: number | null): string {
    if (secondsLeft === null) {
        return `${progressPercent}%`;
    }

    return `${progressPercent}% · faltam ${formatTimeLeft(secondsLeft)}`;
}

function describeCrewLine(video: VideoSummary): string {
    if (video.isCancelling === true) {
        return "Cancelando…";
    }

    return toCrewLine(video);
}

/** Queued or processing: the crew member at work, over the frame, with how far it is. */
export function WorkingOverlay({ video }: { video: VideoSummary }) {
    const progressPercent = video.progressPercent;
    const secondsLeft = useProcessingTimeLeft(video.processingStartedAt, progressPercent);

    return (
        <div className={cn(OVERLAY_CLASS, "bg-black/65")}>
            <StageCrewMascot status={video.status} isWorking className="size-11 @max-xs:hidden" />
            <p className="line-clamp-2 font-semibold">{describeCrewLine(video)}</p>
            <Progress
                value={progressPercent}
                className="h-1 w-3/4 bg-black/40"
                aria-label={`Progresso: ${progressPercent}%`}
            />
            <p className="text-xs text-white/75 tabular-nums">
                {describeProgress(progressPercent, secondsLeft)}
            </p>
        </div>
    );
}

/** Cancelled by the person: dimmed, labelled, and resumed from the card's menu. */
export function CancelledOverlay(): ReactNode {
    return (
        <div className={cn(OVERLAY_CLASS, "bg-black/55")}>
            <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">
                Cancelado
            </span>
            <StageCrewMascot status="cancelled" className="size-9 @max-xs:hidden" />
            <p className="font-semibold">Parado por você. Retome pelo menu do vídeo.</p>
        </div>
    );
}

interface FailedOverlayProps {
    video: VideoSummary;
    onRetry: () => void;
    isRetrying: boolean;
    retryError: string | null;
}

/**
 * Failed: Guarda says what went wrong, and the retry sits right there on the video. The frame is
 * only dimmed: one small red badge marks the failure, so a list with errors does not turn red.
 */
/** The full failure text: the overlay clamps it, so the card meta repeats it in full. */
export function describeFailure(video: VideoSummary, retryError: string | null): string {
    return retryError ?? video.errorMessage ?? FALLBACK_FAILURE_MESSAGE;
}

export function FailedOverlay({ video, onRetry, isRetrying, retryError }: FailedOverlayProps) {
    const message = describeFailure(video, retryError);

    return (
        <div className={cn(OVERLAY_CLASS, "bg-black/70")}>
            <span className="absolute top-2 right-2 rounded-md bg-destructive px-1.5 py-0.5 text-xs font-bold text-destructive-foreground">
                Com erro
            </span>
            <StageCrewMascot status="failed" className="size-9 @max-xs:hidden" />
            <p aria-hidden="true" className="line-clamp-2 font-semibold">
                {message}
            </p>
            <Button
                variant="secondary"
                size="sm"
                className="pointer-events-auto relative z-10"
                onClick={onRetry}
                disabled={isRetrying}
                aria-busy={isRetrying}
            >
                <RestartIcon aria-hidden="true" />
                Tentar de novo
            </Button>
        </div>
    );
}
