import CheckIcon from "~icons/lucide/check";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

export const STUDIO_STEPS = ["trim", "captions", "style"] as const;

export type StudioStep = (typeof STUDIO_STEPS)[number];

export const STUDIO_STEP_LABELS: Record<StudioStep, string> = {
    trim: "Trecho",
    captions: "Legendas",
    style: "Estilo",
};

/** The step before and after the given one; undefined at either end. */
export function findNeighbourSteps(step: StudioStep): {
    previous: StudioStep | undefined;
    next: StudioStep | undefined;
} {
    const index = STUDIO_STEPS.indexOf(step);

    return { previous: STUDIO_STEPS[index - 1], next: STUDIO_STEPS[index + 1] };
}

interface StudioStepperProps {
    step: StudioStep;
    /** A short fact shown beside each label on wide screens, e.g. the clip's length. */
    summaries: Record<StudioStep, string | null>;
    onStepChange: (step: StudioStep) => void;
}

function toAriaCurrent(isCurrent: boolean): "step" | undefined {
    if (isCurrent === true) {
        return "step";
    }

    return undefined;
}

// The marker is a picture of the order; the name says the step, aria-current says which is open.
function StepMarker({ position, isDone }: { position: number; isDone: boolean }): ReactNode {
    if (isDone === true) {
        return (
            <span
                aria-hidden="true"
                className="grid size-5.5 place-items-center rounded-full bg-success text-background"
            >
                <CheckIcon className="size-3.5" aria-hidden="true" />
            </span>
        );
    }

    return (
        <span
            aria-hidden="true"
            className="grid size-5.5 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground group-aria-[current=step]:bg-background group-aria-[current=step]:text-foreground"
        >
            {position}
        </span>
    );
}

/**
 * Trecho, Legendas, Estilo: one at a time beside the preview. Any step can be opened directly;
 * the ones before the current show a check so the order still reads as a path.
 */
export function StudioStepper({ step, summaries, onStepChange }: StudioStepperProps): ReactNode {
    const currentIndex = STUDIO_STEPS.indexOf(step);

    return (
        <nav aria-label="Etapas do Studio">
            <ol className="flex items-center gap-1">
                {STUDIO_STEPS.map((candidate, index) => {
                    const summary = summaries[candidate];

                    return (
                        <li key={candidate} className="min-w-0 flex-1 @4xl/studio:flex-none">
                            <button
                                type="button"
                                aria-current={toAriaCurrent(candidate === step)}
                                onClick={() => onStepChange(candidate)}
                                className={cn(
                                    "group flex h-9 w-full items-center justify-center gap-1.5 rounded-xl ps-1.5 pe-2.5 text-xs @sm/studio:gap-2 @sm/studio:ps-2 @sm/studio:pe-3.5 @sm/studio:text-sm font-medium whitespace-nowrap text-muted-foreground outline-none transition-[color,background-color,scale] hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                                    index < currentIndex && "text-foreground",
                                    "aria-[current=step]:bg-primary-solid aria-[current=step]:text-primary-foreground",
                                )}
                            >
                                <StepMarker position={index + 1} isDone={index < currentIndex} />
                                {STUDIO_STEP_LABELS[candidate]}
                                {summary !== null && (
                                    <span className="sr-only text-xs font-normal tabular-nums opacity-70 @6xl/studio:not-sr-only">
                                        <span className="sr-only">, </span>
                                        {summary}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
