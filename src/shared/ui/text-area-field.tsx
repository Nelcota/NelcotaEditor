import type { ComponentProps, ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { Label } from "#/shared/ui/label";

interface TextAreaFieldProps extends Omit<ComponentProps<"textarea">, "onChange"> {
    id: string;
    label: string;
    errors: Array<string>;
    hint?: string;
    onValueChange: (value: string) => void;
}

/** The error when there is one, otherwise the hint, so screen readers read what is on screen. */
function describedBy(hasErrors: boolean, id: string, hasHint: boolean): string | undefined {
    if (hasErrors === true) {
        return `${id}-error`;
    }

    if (hasHint === true) {
        return `${id}-hint`;
    }

    return undefined;
}

/** A multi-line TextField: the same label, hint and error lines around a resizable box. */
export function TextAreaField({
    id,
    label,
    errors,
    hint,
    onValueChange,
    className,
    ...textareaProps
}: TextAreaFieldProps): ReactNode {
    const hasErrors = errors.length > 0;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <textarea
                id={id}
                aria-invalid={hasErrors}
                aria-describedby={describedBy(hasErrors, id, hint !== undefined)}
                onChange={(event) => onValueChange(event.target.value)}
                className={cn(
                    "min-h-32 w-full min-w-0 resize-y rounded-xl border border-input bg-card px-3 py-2.5 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    "hover:border-ring/60 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring",
                    "aria-invalid:border-destructive",
                    className,
                )}
                {...textareaProps}
            />
            {hint !== undefined && hasErrors === false && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            {hasErrors === true && (
                <p id={`${id}-error`} className="text-sm text-destructive">
                    {errors.join(" ")}
                </p>
            )}
        </div>
    );
}
