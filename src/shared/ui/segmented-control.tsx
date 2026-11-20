import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

export interface SegmentOption<Value extends string> {
    value: Value;
    label: ReactNode;
    /** Spoken name when the label is not plain text. */
    ariaLabel?: string;
}

interface SegmentedControlProps<Value extends string> {
    label: string;
    value: Value;
    options: ReadonlyArray<SegmentOption<Value>>;
    onValueChange: (value: Value) => void;
    disabled?: boolean;
    className?: string;
}

/** A short choice shown all at once: arrow keys move between options, like any radio group. */
export function SegmentedControl<Value extends string>({
    label,
    value,
    options,
    onValueChange,
    disabled = false,
    className,
}: SegmentedControlProps<Value>): ReactNode {
    return (
        <RadioGroup.Root
            aria-label={label}
            value={value}
            disabled={disabled}
            orientation="horizontal"
            onValueChange={(selected) => {
                const option = options.find((candidate) => candidate.value === selected);

                if (option === undefined) {
                    return;
                }

                onValueChange(option.value);
            }}
            className={cn(
                "grid auto-cols-fr grid-flow-col gap-1 rounded-lg border bg-background p-1",
                className,
            )}
        >
            {options.map((option) => (
                <RadioGroup.Item
                    key={option.value}
                    value={option.value}
                    aria-label={option.ariaLabel}
                    className="h-8 rounded-md px-2 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-secondary data-[state=checked]:text-foreground motion-safe:active:scale-[0.99]"
                >
                    {option.label}
                </RadioGroup.Item>
            ))}
        </RadioGroup.Root>
    );
}
