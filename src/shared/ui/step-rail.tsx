import CheckIcon from "~icons/lucide/check";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import type { IconComponent } from "#/shared/ui/icon-component";
import { StepProgressBar } from "#/shared/ui/step-progress";

export interface StepItem {
    title: string;
    hint: string;
}

export type StepTone = "default" | "danger";

type StepState = "done" | "now" | "later";

const TONE_TILE_CLASSES: Record<StepTone, string> = {
    default: "bg-primary-solid text-primary-foreground",
    danger: "bg-destructive text-destructive-foreground",
};

const NUMBER_CLASSES: Record<StepState, string> = {
    done: "border-success bg-success text-background",
    now: "border-primary-solid bg-primary-solid text-primary-foreground",
    later: "border-foreground/20 text-muted-foreground",
};

const TITLE_CLASSES: Record<StepState, string> = {
    done: "text-foreground",
    now: "text-primary-ink",
    later: "text-muted-foreground",
};

// The line under each number, joining it to the next step; green once that step is behind.
const CONNECTOR_CLASS =
    "after:absolute after:start-[1.3125rem] after:top-[2.375rem] after:-bottom-1.5 after:w-0.5 after:rounded-full after:content-[''] last:after:hidden";

const CONNECTOR_CLASSES: Record<StepState, string> = {
    done: "after:bg-success",
    now: "after:bg-border",
    later: "after:bg-border",
};

function toStepState(index: number, currentIndex: number): StepState {
    if (index < currentIndex) {
        return "done";
    }

    if (index === currentIndex) {
        return "now";
    }

    return "later";
}

interface StepRowProps {
    step: StepItem;
    index: number;
    state: StepState;
    onSelect: (() => void) | null;
}

function StepRowContent({ step, index, state }: Omit<StepRowProps, "onSelect">): ReactNode {
    return (
        <>
            <span
                className={cn(
                    "relative z-1 grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] text-xs font-bold tabular-nums",
                    NUMBER_CLASSES[state],
                )}
            >
                {state === "done" && <CheckIcon aria-hidden="true" className="size-4" />}
                {state !== "done" && index + 1}
            </span>
            <span className="grid min-w-0 text-start">
                <span className={cn("text-sm leading-7 font-semibold", TITLE_CLASSES[state])}>
                    {step.title}
                </span>
                <span className="-mt-1 text-xs text-muted-foreground">{step.hint}</span>
            </span>
        </>
    );
}

/** One step; the ones behind are buttons, so the person can go back to any of them. */
function StepRow(props: StepRowProps): ReactNode {
    const { step, index, state, onSelect } = props;
    const rowClass = "flex w-full items-start gap-3 rounded-xl p-2";

    if (onSelect === null) {
        return (
            <div className={cn(rowClass, state === "now" && "bg-primary/12")}>
                <StepRowContent step={step} index={index} state={state} />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                rowClass,
                "outline-none transition-[background-color,scale] hover:bg-foreground/5 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
            )}
        >
            <StepRowContent step={step} index={index} state={state} />
        </button>
    );
}

interface StepRailProps {
    title: string;
    icon: IconComponent;
    tone: StepTone;
    steps: ReadonlyArray<StepItem>;
    currentIndex: number;
    /** Steps up to this index can be reopened from the rail. */
    reachableIndex: number;
    onStepSelect: (index: number) => void;
}

/**
 * The sidebar inside a stepped dialog: what the dialog is, every step with a one-line hint, and how
 * far along the person is. Phones hide it and show the bar above the title instead.
 */
export function StepRail(props: StepRailProps): ReactNode {
    const { title, icon: Icon, tone, steps, currentIndex, reachableIndex, onStepSelect } = props;

    return (
        <nav
            aria-label={`Passos: ${title}`}
            className="hidden min-h-0 flex-col gap-5 overflow-y-auto border-e bg-foreground/[0.03] px-3 py-5 sm:flex"
        >
            <p className="flex items-center gap-2.5 px-2 font-semibold">
                <span
                    className={cn(
                        "grid size-8 place-items-center rounded-lg",
                        TONE_TILE_CLASSES[tone],
                    )}
                >
                    <Icon aria-hidden="true" className="size-4" />
                </span>
                {title}
            </p>
            <ol className="grid gap-0.5">
                {steps.map((step, index) => {
                    const state = toStepState(index, currentIndex);
                    let onSelect: (() => void) | null = null;
                    let ariaCurrent: "step" | undefined = undefined;

                    if (state === "now") {
                        ariaCurrent = "step";
                    }

                    if (index !== currentIndex && index <= reachableIndex) {
                        onSelect = () => onStepSelect(index);
                    }

                    return (
                        <li
                            key={step.title}
                            aria-current={ariaCurrent}
                            className={cn("relative", CONNECTOR_CLASS, CONNECTOR_CLASSES[state])}
                        >
                            <StepRow step={step} index={index} state={state} onSelect={onSelect} />
                        </li>
                    );
                })}
            </ol>
            <div className="mt-auto grid gap-2 px-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                    Passo {currentIndex + 1} de {steps.length}
                </p>
                <StepProgressBar current={currentIndex + 1} total={steps.length} />
            </div>
        </nav>
    );
}
