import CheckIcon from "~icons/lucide/check";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { toCrewLine } from "#/modules/videos/model/crew-lines";
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

/** Upcoming crew members wait in grey; the one at work is in colour and moving. */
const STEP_MASCOT_STYLES: Record<StepState, string> = {
    done: "",
    current: "",
    upcoming: "opacity-40 grayscale",
};

const STEP_LABEL_STYLES: Record<StepState, string> = {
    done: "text-muted-foreground",
    current: "font-medium",
    upcoming: "text-muted-foreground",
};

function StepCrew({ status, state }: { status: VideoStatus; state: StepState }) {
    return (
        <span className="relative shrink-0">
            <StageCrewMascot
                status={status}
                isWorking={state === "current"}
                className={cn("size-8", STEP_MASCOT_STYLES[state])}
            />
            {state === "done" && (
                <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-success text-background ring-2 ring-popover">
                    <CheckIcon className="size-2.5 [&_path]:stroke-[3.5]" aria-hidden="true" />
                </span>
            )}
        </span>
    );
}

function describeStage(video: VideoSummary): string {
    if (video.status === "queued") {
        return "Na fila: começa assim que o vídeo anterior terminar.";
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

/** The stage in words and how far the whole video is; the step list shows who is at work. */
function StageHeadline({ video }: { video: VideoSummary }) {
    const secondsLeft = useProcessingTimeLeft(video.processingStartedAt, video.progressPercent);

    return (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div>
                <p className="text-lg font-semibold">{describeStage(video)}</p>
                <p className="text-sm text-foreground">{toCrewLine(video)}</p>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
                {describeProgress(video.progressPercent, secondsLeft)}
            </p>
        </div>
    );
}

function ProcessingSteps({ video }: { video: VideoSummary }) {
    return (
        <ol className="grid gap-3 sm:auto-cols-fr sm:grid-flow-col">
            {PROCESSING_STEPS.map((step) => {
                const state = stepState(step.status, video.status);

                return (
                    <li
                        key={step.status}
                        aria-current={state === "current" && "step"}
                        className="flex items-center gap-2.5 text-sm"
                    >
                        <StepCrew status={step.status} state={state} />
                        <span className={STEP_LABEL_STYLES[state]}>{step.label}</span>
                    </li>
                );
            })}
        </ol>
    );
}

export function ProcessingPanel({ video }: { video: VideoSummary }) {
    return (
        <section className="grid gap-5 rounded-2xl border bg-popover p-4 sm:p-5">
            <StageHeadline video={video} />
            <Progress value={video.progressPercent} aria-label="Progresso do processamento" />
            <ProcessingSteps video={video} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Pode fechar esta página: o processamento continua. Os cortes aparecem aqui e na
                    lista de vídeos assim que ficarem prontos.
                </p>
                <CancelVideoButton video={video} />
            </div>
        </section>
    );
}
