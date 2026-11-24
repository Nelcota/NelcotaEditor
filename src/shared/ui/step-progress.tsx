import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

const PERCENT = 100;

interface StepProgressProps {
    /** The step being shown, counted from 1. */
    current: number;
    total: number;
}

function toPercent(current: number, total: number): number {
    if (total <= 0 || Number.isFinite(total) === false) {
        return 0;
    }

    return Math.min(PERCENT, Math.max(0, Math.round((current / total) * PERCENT)));
}

/** A thin bar under "Passo X de N"; the text says the same, so the bar is decoration. */
export function StepProgressBar({ current, total }: StepProgressProps): ReactNode {
    return (
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${toPercent(current, total)}%` }}
            />
        </div>
    );
}

/** One segment per step, for phones, where the rail does not fit: done, current, then ahead. */
export function StepSegments({ current, total }: StepProgressProps): ReactNode {
    const indexes = Array.from({ length: Math.max(0, total) }, (_, index) => index + 1);

    return (
        <div aria-hidden="true" className="flex gap-1 sm:hidden">
            {indexes.map((stepNumber) => (
                <span
                    key={stepNumber}
                    className={cn(
                        "h-1 flex-1 rounded-full bg-foreground/12",
                        stepNumber < current && "bg-success",
                        stepNumber === current && "bg-primary",
                    )}
                />
            ))}
        </div>
    );
}
