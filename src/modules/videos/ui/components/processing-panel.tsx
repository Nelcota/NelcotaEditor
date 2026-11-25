import type { ReactNode } from "react";
import CheckIcon from "~icons/lucide/check";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { CancelVideoButton } from "#/modules/videos/ui/components/cancel-video-button";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { useProcessingTimeLeft } from "#/modules/videos/ui/hooks/use-processing-time-left";
import { PROCESSING_STEPS, VIDEO_STATUS_LABELS } from "#/modules/videos/model/video-status-labels";
import { cn } from "#/shared/ui/cn";
import { formatTimeLeft } from "#/shared/ui/format";
import { Progress } from "#/shared/ui/progress";

type StepState = "done" | "current" | "upcoming";

const STEP_ORDER: Array<VideoStatus> = [
    "queued",
    "downloading",
    "transcribing",
    "selecting",
    "rendering",
    "done",
];

function stepState(stepStatus: VideoStatus, currentStatus: VideoStatus): StepState {
    const stepIndex = STEP_ORDER.indexOf(stepStatus);
    const currentIndex = STEP_ORDER.indexOf(currentStatus);

    if (stepIndex < currentIndex) {
        return "done";
    }

    if (stepIndex === currentIndex) {
        return "current";
    }

    return "upcoming";
}

const STEP_LABEL_STYLES: Record<StepState, string> = {
    done: "text-muted-foreground",
    current: "font-medium",
    upcoming: "text-muted-foreground",
};

interface StepCrewProps {
    status: VideoStatus;
    state: StepState;
}

function StepCrew({ status, state }: StepCrewProps): ReactNode {
    return (
        <span
            className={cn(
                "relative grid place-items-center",
                state === "upcoming" && "opacity-65 grayscale",
            )}
        >
            <StageCrewMascot
                status={status}
                isWorking={state === "current"}
                context="panel"
                className="size-14 @xl:size-20"
            />
            {state === "done" && (
                <span className="absolute -end-1 -bottom-1 grid size-4 place-items-center rounded-full bg-success text-background ring-2 ring-popover">
                    <CheckIcon className="size-2.5 [&_path]:stroke-[3.5]" aria-hidden="true" />
                </span>
            )}
        </span>
    );
}

function describeStage(video: VideoSummary): string {
    if (video.status === "queued") {
        return "Na fila: começa assim que chegar a vez dele.";
    }

    return `${VIDEO_STATUS_LABELS[video.status]}…`;
}

function describeProgress(progressPercent: number, secondsLeft: number | null): string {
    const percent = `${progressPercent}% do total`;

    if (secondsLeft === null) {
        return percent;
    }

    return `${percent} · faltam ${formatTimeLeft(secondsLeft)}`;
}

/** The stage in words and how far the whole video is; the step list below shows who is at work. */
function StageHeadline({ video }: { video: VideoSummary }) {
    const secondsLeft = useProcessingTimeLeft(video.processingStartedAt, video.progressPercent);

    return (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <p className="text-xl font-semibold @md:text-2xl">{describeStage(video)}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
                {describeProgress(video.progressPercent, secondsLeft)}
            </p>
        </div>
    );
}

function ProcessingSteps({ status }: { status: VideoStatus }): ReactNode {
    return (
        <ol className="processing-crew grid grid-cols-2 gap-x-3 gap-y-5 @3xl:grid-cols-4 @3xl:gap-x-6">
            {PROCESSING_STEPS.map((step) => {
                const state = stepState(step.status, status);

                return (
                    <li
                        key={step.status}
                        aria-current={state === "current" && "step"}
                        className="grid min-w-0 content-start justify-items-center gap-2 text-center text-sm @md:text-base"
                    >
                        <StepCrew status={step.status} state={state} />
                        <span className={STEP_LABEL_STYLES[state]}>{step.label}</span>
                    </li>
                );
            })}
        </ol>
    );
}

export function ProcessingPanel({ video }: { video: VideoSummary }): ReactNode {
    const { status, progressPercent } = video;

    return (
        <section
            aria-label="Processamento do vídeo"
            className="@container grid gap-6 rounded-2xl border bg-popover p-4 sm:p-6"
        >
            <StageHeadline video={video} />
            <Progress value={progressPercent} aria-label="Progresso do processamento" />
            <ProcessingSteps status={status} />
            <div className="flex flex-col gap-3 @lg:flex-row @lg:items-center @lg:justify-between">
                <p className="max-w-prose text-sm text-muted-foreground">
                    Pode fechar esta página: o processamento continua. Os cortes aparecem aqui e na
                    lista de vídeos assim que ficarem prontos.
                </p>
                <CancelVideoButton video={video} />
            </div>
        </section>
    );
}
