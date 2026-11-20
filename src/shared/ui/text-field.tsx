import type { ComponentProps } from "react";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";

interface TextFieldProps extends Omit<ComponentProps<"input">, "onChange"> {
    id: string;
    label: string;
    errors: Array<string>;
    hint?: string;
    onValueChange: (value: string) => void;
}

function describedBy(hasErrors: boolean, errorId: string): string | undefined {
    if (hasErrors === false) {
        return undefined;
    }

    return errorId;
}

export function TextField({
    id,
    label,
    errors,
    hint,
    onValueChange,
    ...inputProps
}: TextFieldProps) {
    const errorId = `${id}-error`;
    const hasErrors = errors.length > 0;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                aria-invalid={hasErrors}
                aria-describedby={describedBy(hasErrors, errorId)}
                onChange={(event) => onValueChange(event.target.value)}
                className="h-11"
                {...inputProps}
            />
            {hint !== undefined && hasErrors === false && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {hasErrors === true && (
                <p id={errorId} className="text-sm text-destructive">
                    {errors.join(" ")}
                </p>
            )}
        </div>
    );
}
