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

const FIELD_SIZE_CLASSES = {
    default: {
        label: "",
        input: "h-11",
        password: "pr-28",
        toggle: "text-sm",
        hint: "text-xs",
        error: "text-sm",
    },
    large: {
        label: "text-lg leading-tight",
        input: "h-15 px-4 text-lg",
        password: "pr-36",
        toggle: "text-lg [&>svg]:size-5",
        hint: "text-sm",
        error: "text-base",
    },
} as const;

interface TextFieldProps extends Omit<ComponentProps<"input">, "onChange"> {
    id: string;
    label: string;
    errors: Array<string>;
    fieldSize?: keyof typeof FIELD_SIZE_CLASSES;
    hint?: string;
    onValueChange: (value: string) => void;
}

interface PasswordVisibilityToggleProps {
    inputId: string;
    isPasswordVisible: boolean;
    onToggle: () => void;
    className: string;
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
    className,
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
                className={cn(
                    "absolute inset-y-1 right-1 inline-flex items-center gap-1.5 rounded-md px-2.5 font-medium text-muted-foreground transition-[color,background-color,scale] outline-none hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                    className,
                )}
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
    fieldSize = "default",
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
    const sizeClasses = FIELD_SIZE_CLASSES[fieldSize];

    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className={sizeClasses.label}>
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={resolveInputType(type, isPasswordVisible)}
                    aria-invalid={hasErrors}
                    aria-describedby={describedBy(hasErrors, id, hint !== undefined)}
                    onChange={(event) => onValueChange(event.target.value)}
                    className={cn(
                        sizeClasses.input,
                        isPassword === true && sizeClasses.password,
                        isPassword === true && "[&::-ms-clear]:hidden [&::-ms-reveal]:hidden",
                        className,
                    )}
                    {...inputProps}
                />
                {isPassword === true && (
                    <PasswordVisibilityToggle
                        inputId={id}
                        isPasswordVisible={isPasswordVisible}
                        onToggle={() => setIsPasswordVisible((isVisible) => isVisible === false)}
                        className={sizeClasses.toggle}
                    />
                )}
            </div>
            {hint !== undefined && hasErrors === false && (
                <p id={`${id}-hint`} className={cn(sizeClasses.hint, "text-muted-foreground")}>
                    {hint}
                </p>
            )}
            {hasErrors === true && (
                <p id={errorId} className={cn(sizeClasses.error, "text-destructive")}>
                    {errors.join(" ")}
                </p>
            )}
        </div>
    );
}
