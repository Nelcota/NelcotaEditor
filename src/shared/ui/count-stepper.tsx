import PlusIcon from "~icons/lucide/plus";
import MinusIcon from "~icons/lucide/minus";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

// At the bounds the button only looks disabled (aria-disabled): a native `disabled` would drop the
// keyboard focus to <body> right after the press that reached the limit.
const BOUND_BUTTON_CLASS =
    "aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100";

interface CountStepperProps {
    id: string;
    label: string;
    icon: ReactNode;
    /** E.g. `sr-only` in a settings row, whose own label already names it. */
    labelClassName?: string;
    value: number;
    min: number;
    max: number;
    /** The count as read aloud and shown, e.g. "5 cortes". */
    formatValue: (value: number) => string;
    decreaseLabel: string;
    increaseLabel: string;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

/**
 * A small count as "− 5 +": it reads and changes faster in place than in a list that opens over
 * the page.
 */
export function CountStepper(props: CountStepperProps): ReactNode {
    const { id, label, icon, labelClassName, value, min, max, formatValue } = props;
    const { decreaseLabel, increaseLabel, onValueChange, disabled = false } = props;
    const labelId = `${id}-label`;
    const isAtMinimum = value <= min;
    const isAtMaximum = value >= max;

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
            <span
                id={labelId}
                className={cn("flex items-center gap-2 text-sm font-medium", labelClassName)}
            >
                {icon}
                {label}
            </span>
            <fieldset
                aria-labelledby={labelId}
                className="flex min-w-0 min-h-11 items-center justify-between gap-2 rounded-xl border border-input bg-background p-1"
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={decreaseLabel}
                    aria-disabled={isAtMinimum}
                    className={BOUND_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={decrease}
                >
                    <MinusIcon aria-hidden="true" />
                </Button>
                <output id={id} aria-live="polite" className="text-sm font-semibold tabular-nums">
                    {formatValue(value)}
                </output>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={increaseLabel}
                    aria-disabled={isAtMaximum}
                    className={BOUND_BUTTON_CLASS}
                    disabled={disabled}
                    onClick={increase}
                >
                    <PlusIcon aria-hidden="true" />
                </Button>
            </fieldset>
        </div>
    );
}
