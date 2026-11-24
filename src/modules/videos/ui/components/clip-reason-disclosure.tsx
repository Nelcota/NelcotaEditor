import ChevronDownIcon from "~icons/lucide/chevron-down";
import type { ReactNode } from "react";

/** Why Brilho picked the clip, folded so a long list stays one line per clip. */
export function ClipReasonDisclosure({ reason }: { reason: string }): ReactNode {
    if (reason.length === 0) {
        return null;
    }

    return (
        <details className="group text-sm">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] [&::-webkit-details-marker]:hidden">
                Por que este corte
                <ChevronDownIcon
                    aria-hidden="true"
                    className="size-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
            </summary>
            <p className="mt-1 max-w-prose text-muted-foreground">{reason}</p>
        </details>
    );
}
