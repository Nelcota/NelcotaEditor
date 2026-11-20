import * as React from "react";
import { cn } from "#/shared/ui/cn";
import { Progress as ProgressPrimitive } from "radix-ui";

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

/** Radix rejects values outside 0–100 (and NaN); a missing value means "indeterminate". */
function toBoundedPercent(value: number | null | undefined): number | null {
    if (value === null || value === undefined || Number.isFinite(value) === false) {
        return null;
    }

    return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
}

function Progress({
    className,
    value,
    ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "max">) {
    const percent = toBoundedPercent(value);
    const indicatorPercent = percent ?? MIN_PERCENT;

    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            value={percent}
            max={MAX_PERCENT}
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
                className,
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                data-slot="progress-indicator"
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{ transform: `translateX(-${MAX_PERCENT - indicatorPercent}%)` }}
            />
        </ProgressPrimitive.Root>
    );
}

export { Progress };
