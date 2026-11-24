import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

interface SettingsRowProps {
    /** The setting's name, or a richer leading block (the profile row's photo and name). */
    label: ReactNode;
    description?: ReactNode;
    /** Shown before the label: a mascot or an icon. */
    art?: ReactNode;
    /** The control or value on the trailing side. */
    children?: ReactNode;
    /** The label's id, so a control can point at it with aria-labelledby. */
    labelId?: string;
    className?: string;
}

/**
 * One line of a settings group: the name and its line on the leading side, the control trailing.
 * On narrow screens the control wraps under the name instead of squeezing it.
 */
export function SettingsRow({
    label,
    description,
    art,
    children,
    labelId,
    className,
}: SettingsRowProps): ReactNode {
    return (
        <div
            className={cn(
                "flex min-h-16 flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:gap-x-6 sm:px-5",
                className,
            )}
        >
            <div className="flex min-w-40 flex-[1_1_12rem] items-center gap-3">
                {art}
                <div className="grid min-w-0 gap-0.5">
                    <span id={labelId} className="text-sm font-semibold">
                        {label}
                    </span>
                    {description !== undefined && (
                        <span className="text-xs text-muted-foreground">{description}</span>
                    )}
                </div>
            </div>
            {children !== undefined && <div className="flex shrink-0 items-center">{children}</div>}
        </div>
    );
}
