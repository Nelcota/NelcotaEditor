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

/** A short choice shown all at once as pills (the reference's filter tags); arrow keys move between them. */
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
            onValueChange={(selected) => {
                const option = options.find((candidate) => candidate.value === selected);

                if (option === undefined) {
                    return;
                }

                onValueChange(option.value);
            }}
            className={cn("flex flex-wrap gap-1.5", className)}
        >
            {options.map((option) => (
                <RadioGroup.Item
                    key={option.value}
                    value={option.value}
                    aria-label={option.ariaLabel}
                    className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm leading-tight font-semibold text-balance text-muted-foreground outline-none transition-[color,background-color,box-shadow,scale] hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary-ink motion-safe:enabled:active:scale-[0.99] sm:flex-none [&>svg]:size-4"
                >
                    {option.label}
                </RadioGroup.Item>
            ))}
        </RadioGroup.Root>
    );
}
