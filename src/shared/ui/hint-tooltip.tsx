import type { ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/shared/ui/tooltip";

interface HintTooltipProps {
    label: string;
    /** A keyboard shortcut shown after the label, e.g. "Ctrl+Z". */
    shortcut?: string;
    /** One focusable element (usually an icon button with its own aria-label). */
    children: ReactElement;
}

/**
 * The hint of an icon button. Unlike the native `title`, it shows on keyboard focus and keeps
 * the theme; the shortcut it mentions is extra, so the button's aria-label stays the name.
 */
export function HintTooltip({ label, shortcut, children }: HintTooltipProps): ReactNode {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>
                {label}
                {shortcut !== undefined && (
                    <kbd className="ml-1.5 font-sans font-semibold opacity-70">{shortcut}</kbd>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
