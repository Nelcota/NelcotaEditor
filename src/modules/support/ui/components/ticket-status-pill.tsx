import type { ReactNode } from "react";
import { TICKET_STATUS_LABELS } from "#/modules/support/model/support-ticket";
import type { TicketStatus } from "#/modules/support/model/support-ticket";
import { cn } from "#/shared/ui/cn";

/**
 * The dot and the tint carry the hue; the word stays ink where a coloured word on its own tint
 * would read under 4.5:1 (amber in the light theme).
 */
const STATUS_STYLES: Readonly<Record<TicketStatus, { pill: string; dot: string }>> = {
    open: { pill: "bg-warning/15 text-foreground", dot: "bg-warning" },
    answered: { pill: "bg-primary/15 text-primary-ink", dot: "bg-primary" },
    closed: { pill: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
};

export function TicketStatusPill({ status }: { status: TicketStatus }): ReactNode {
    const style = STATUS_STYLES[status];

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                style.pill,
            )}
        >
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
            {TICKET_STATUS_LABELS[status]}
        </span>
    );
}
