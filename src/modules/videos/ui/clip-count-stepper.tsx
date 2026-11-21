import AddIcon from "~icons/solar/add-linear";
import MinusIcon from "~icons/solar/minus-linear";
import ScissorsIcon from "~icons/solar/scissors-linear";
import type { ReactNode } from "react";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/videos/video-status";
import { pluralize } from "#/modules/videos/ui/pluralize";
import { Button } from "#/shared/ui/button";

// At 1 or 10 the button only looks disabled (aria-disabled): a native `disabled` would drop the
// keyboard focus to <body> right after the press that reached the limit.
const BOUND_BUTTON_CLASS =
    "aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100";

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
    const isAtMinimum = value <= MIN_CLIP_COUNT;
    const isAtMaximum = value >= MAX_CLIP_COUNT;

    function decrease(): void {
        if (isAtMinimum === true) {
            return;
        }

        onValueChange(value - 1);
    }

    function increase(): void {
        if (isAtMaximum === true) {
            return;
        }

        onValueChange(value + 1);
    }

    return (
        <div className="grid gap-2">
            <span id={labelId} className="flex items-center gap-2 text-sm font-semibold">
                <ScissorsIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                {label}
            </span>
            <div
                role="group"
                aria-labelledby={labelId}
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-input bg-background p-1"
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Menos um corte"
                    aria-disabled={isAtMinimum}
                    className={BOUND_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={decrease}
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
                    aria-disabled={isAtMaximum}
                    className={BOUND_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={increase}
                >
                    <AddIcon aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
