import RotateCwIcon from "~icons/lucide/rotate-cw";
import type { ReactNode } from "react";
import { toCrewLine } from "#/modules/videos/crew-lines";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { describeVideoFailure } from "#/modules/videos/ui/describe-video-failure";
import type { VideoSummary } from "#/modules/videos/video-views";
import { Button } from "#/shared/ui/button";
import { pluralize } from "#/shared/ui/pluralize";
import { Progress } from "#/shared/ui/progress";

interface VideoRowStatusProps {
    video: VideoSummary;
    /** The row title's id: every failed row has the same retry button, the title says which. */
    titleId: string;
    onRetry: () => void;
    isRetrying: boolean;
    retryError: string | null;
}

/** While retrying the button only looks disabled: a native `disabled` would drop focus to <body>. */
function RetryButton(props: Omit<VideoRowStatusProps, "video" | "retryError">): ReactNode {
    const { titleId, onRetry, isRetrying } = props;

    return (
        <Button
            variant="secondary"
            size="sm"
            className="relative z-10 aria-disabled:opacity-50"
            onClick={() => {
                if (isRetrying === true) {
                    return;
                }

                onRetry();
            }}
            aria-describedby={titleId}
            aria-disabled={isRetrying}
            aria-busy={isRetrying}
        >
            <RotateCwIcon aria-hidden="true" />
            Tentar de novo
        </Button>
    );
}

function WorkingStatus({ video }: { video: VideoSummary }): ReactNode {
    const progressPercent = video.progressPercent;

    return (
        <span className="flex min-w-40 flex-1 items-center gap-2">
            <StageCrewMascot status={video.status} isWorking className="size-5" />
            <span className="shrink-0">{toCrewLine(video)}</span>
            <Progress
                value={progressPercent}
                className="h-1 max-w-32 flex-1 bg-muted"
                aria-label={`Progresso: ${progressPercent}%`}
            />
        </span>
    );
}

/** Where a video stands, in one line: its clips when done, the crew at work, or what went wrong. */
export function VideoRowStatus(props: VideoRowStatusProps): ReactNode {
    const { video, retryError } = props;
    const readyClipCount = video.readyClipCount;

    if (video.status === "done") {
        return (
            <span className="font-semibold text-foreground">
                {readyClipCount} {pluralize(readyClipCount, "corte pronto", "cortes prontos")}
            </span>
        );
    }

    if (video.status === "failed") {
        return (
            <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-destructive [overflow-wrap:anywhere]">
                    {describeVideoFailure(video, retryError)}
                </span>
                <RetryButton
                    titleId={props.titleId}
                    onRetry={props.onRetry}
                    isRetrying={props.isRetrying}
                />
            </span>
        );
    }

    if (video.status === "cancelled") {
        return <span>Cancelado por você. Retome pelo menu do vídeo.</span>;
    }

    return <WorkingStatus video={video} />;
}
