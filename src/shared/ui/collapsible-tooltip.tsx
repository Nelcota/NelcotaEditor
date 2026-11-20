import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/shared/ui/tooltip";

interface CollapsibleTooltipProps {
    label: ReactNode;
    isEnabled: boolean;
    children: ReactNode;
}

/** Names an item that only shows its icon (a collapsed sidebar); does nothing when the text is visible. */
export function CollapsibleTooltip({ label, isEnabled, children }: CollapsibleTooltipProps) {
    if (isEnabled === false) {
        return children;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}
