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
            {/* Scaled, not resized: width would lay the page out again on every frame. The
                track's rounding and overflow clip the ends, so the fill needs none. */}
            <div
                className="h-full origin-left bg-primary transition-[scale] duration-300 ease-out"
                style={{ scale: `${toPercent(current, total) / PERCENT} 1` }}
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
