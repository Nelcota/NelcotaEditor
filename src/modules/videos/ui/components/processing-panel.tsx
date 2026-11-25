import { useState } from "react";
import type { ReactNode } from "react";
import CheckIcon from "~icons/lucide/check";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { toCrewLine } from "#/modules/videos/model/crew-lines";
import { CancelVideoButton } from "#/modules/videos/ui/components/cancel-video-button";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { useProcessingTimeLeft } from "#/modules/videos/ui/hooks/use-processing-time-left";
import { PROCESSING_STEPS, VIDEO_STATUS_LABELS } from "#/modules/videos/model/video-status-labels";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { formatTimeLeft } from "#/shared/ui/format";
import { Progress } from "#/shared/ui/progress";

type StepState = "done" | "current" | "upcoming";
type MascotMotion = "system" | "paused" | "playing";

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

interface StepCrewProps {
    status: VideoStatus;
    state: StepState;
    isMotionEnabled: boolean;
    isMotionRequested: boolean;
}

function StepCrew({ status, state, isMotionEnabled, isMotionRequested }: StepCrewProps): ReactNode {
    return (
        <span className="relative shrink-0">
            <StageCrewMascot
                status={status}
                isWorking={state === "current" && isMotionEnabled}
                isMotionRequested={isMotionRequested}
                context="panel"
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

function ProcessingSteps({
    status,
    isMotionEnabled,
    isMotionRequested,
}: {
    status: VideoStatus;
    isMotionEnabled: boolean;
    isMotionRequested: boolean;
}): ReactNode {
    return (
        <ol className="grid gap-3 sm:auto-cols-fr sm:grid-flow-col">
            {PROCESSING_STEPS.map((step) => {
                const state = stepState(step.status, status);

                return (
                    <li
                        key={step.status}
                        aria-current={state === "current" && "step"}
                        className="flex items-center gap-2.5 text-sm"
                    >
                        <StepCrew
                            status={step.status}
                            state={state}
                            isMotionEnabled={isMotionEnabled}
                            isMotionRequested={isMotionRequested}
                        />
                        <span className={STEP_LABEL_STYLES[state]}>{step.label}</span>
                    </li>
                );
            })}
        </ol>
    );
}

function MascotMotionButton({
    motion,
    onToggle,
}: {
    motion: MascotMotion;
    onToggle: () => void;
}): ReactNode {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={onToggle}
        >
            {motion === "system" && (
                <>
                    <span className="motion-safe:hidden">Animar mascotes</span>
                    <span className="hidden motion-safe:inline">Pausar mascotes</span>
                </>
            )}
            {motion === "paused" && "Animar mascotes"}
            {motion === "playing" && "Pausar mascotes"}
        </Button>
    );
}

export function ProcessingPanel({ video }: { video: VideoSummary }): ReactNode {
    const { status, progressPercent, isCancelling } = video;
    const [mascotMotion, setMascotMotion] = useState<MascotMotion>("system");

    function toggleMascotMotion(): void {
        if (
            mascotMotion === "playing" ||
            (mascotMotion === "system" &&
                window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
        ) {
            setMascotMotion("paused");
            return;
        }

        setMascotMotion("playing");
    }

    return (
        <section className="grid gap-5 rounded-2xl border bg-popover p-4 sm:p-5">
            <StageHeadline video={video} />
            <Progress value={progressPercent} aria-label="Progresso do processamento" />
            <ProcessingSteps
                status={status}
                isMotionEnabled={mascotMotion !== "paused" && isCancelling === false}
                isMotionRequested={mascotMotion === "playing"}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Pode fechar esta página: o processamento continua. Os cortes aparecem aqui e na
                    lista de vídeos assim que ficarem prontos.
                </p>
                <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                    {isVideoWorking(status) === true && isCancelling === false && (
                        <MascotMotionButton motion={mascotMotion} onToggle={toggleMascotMotion} />
                    )}
                    <CancelVideoButton video={video} />
                </div>
            </div>
        </section>
    );
}
