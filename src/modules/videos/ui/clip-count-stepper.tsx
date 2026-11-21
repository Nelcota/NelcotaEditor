import AddIcon from "~icons/solar/add-linear";
import MinusIcon from "~icons/solar/minus-linear";
import ScissorsIcon from "~icons/solar/scissors-linear";
import type { ReactNode } from "react";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/videos/video-status";
import { pluralize } from "#/modules/videos/ui/pluralize";
import { Button } from "#/shared/ui/button";

function describeCount(count: number): string {
    return `${count} ${pluralize(count, "corte", "cortes")}`;
}

interface ClipCountStepperProps {
    id: string;
    label?: string;
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

/**
 * The number of clips as "− 5 +": a count from 1 to 10 reads and changes faster in place than
 * in a list that opens over the page.
 */
export function ClipCountStepper({
    id,
    label = "Cortes",
    value,
    onValueChange,
    disabled = false,
}: ClipCountStepperProps): ReactNode {
    const labelId = `${id}-label`;

    return (
        <div className="grid gap-2">
            <span id={labelId} className="flex items-center gap-2 text-sm font-semibold">
                <ScissorsIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />
                {label}
            </span>
            <div
                role="group"
                aria-labelledby={labelId}
                className="flex h-11 items-center justify-between gap-2 rounded-lg border bg-background p-1"
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Menos um corte"
                    disabled={disabled || value <= MIN_CLIP_COUNT}
                    onClick={() => onValueChange(Math.max(MIN_CLIP_COUNT, value - 1))}
                >
                    <MinusIcon aria-hidden="true" />
                </Button>
                <output id={id} aria-live="polite" className="text-sm font-bold tabular-nums">
                    {describeCount(value)}
                </output>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Mais um corte"
                    disabled={disabled || value >= MAX_CLIP_COUNT}
                    onClick={() => onValueChange(Math.min(MAX_CLIP_COUNT, value + 1))}
                >
                    <AddIcon aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
