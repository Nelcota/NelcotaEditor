import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import EyeIcon from "~icons/lucide/eye";
import EyeOffIcon from "~icons/lucide/eye-off";
import { cn } from "#/shared/ui/cn";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";
import {
    getPasswordVisibilityCopy,
    isPasswordInputType,
    resolveInputType,
} from "#/shared/ui/password-visibility";

interface TextFieldProps extends Omit<ComponentProps<"input">, "onChange"> {
    id: string;
    label: string;
    errors: Array<string>;
    hint?: string;
    onValueChange: (value: string) => void;
}

interface PasswordVisibilityToggleProps {
    inputId: string;
    isPasswordVisible: boolean;
    onToggle: () => void;
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

function VisibilityIcon({ isPasswordVisible }: { isPasswordVisible: boolean }): ReactNode {
    if (isPasswordVisible === true) {
        return <EyeOffIcon aria-hidden="true" className="size-4" />;
    }

    return <EyeIcon aria-hidden="true" className="size-4" />;
}

/** Our own reveal button, so every browser shows the same one instead of only Edge's. */
function PasswordVisibilityToggle({
    inputId,
    isPasswordVisible,
    onToggle,
}: PasswordVisibilityToggleProps): ReactNode {
    const [hasToggled, setHasToggled] = useState(false);
    const copy = getPasswordVisibilityCopy(isPasswordVisible);

    return (
        <>
            <button
                type="button"
                aria-controls={inputId}
                aria-label={copy.buttonLabel}
                onClick={() => {
                    setHasToggled(true);
                    onToggle();
                }}
                className="absolute inset-y-1 right-1 inline-flex items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-[color,background-color,transform] outline-none hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
            >
                <VisibilityIcon isPasswordVisible={isPasswordVisible} />
                {copy.buttonText}
            </button>
            {/* Empty until the first click, so the state is only announced when it changes. */}
            <span className="sr-only" aria-live="polite">
                {hasToggled === true && copy.announcement}
            </span>
        </>
    );
}

export function TextField({
    id,
    label,
    errors,
    hint,
    onValueChange,
    type,
    className,
    ...inputProps
}: TextFieldProps): ReactNode {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const errorId = `${id}-error`;
    const hasErrors = errors.length > 0;
    const isPassword = isPasswordInputType(type);

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={resolveInputType(type, isPasswordVisible)}
                    aria-invalid={hasErrors}
                    aria-describedby={describedBy(hasErrors, id, hint !== undefined)}
                    onChange={(event) => onValueChange(event.target.value)}
                    className={cn(
                        "h-11",
                        isPassword === true && "pr-28 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden",
                        className,
                    )}
                    {...inputProps}
                />
                {isPassword === true && (
                    <PasswordVisibilityToggle
                        inputId={id}
                        isPasswordVisible={isPasswordVisible}
                        onToggle={() => setIsPasswordVisible((isVisible) => isVisible === false)}
                    />
                )}
            </div>
            {hint !== undefined && hasErrors === false && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            {hasErrors === true && (
                <p id={errorId} className="text-sm text-destructive">
                    {errors.join(" ")}
                </p>
            )}
        </div>
    );
}
