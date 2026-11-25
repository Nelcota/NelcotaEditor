import UserRoundIcon from "~icons/lucide/user-round";
import type { ReactNode } from "react";
import { STAFF_FALLBACK_NAME } from "#/modules/support/model/support-ticket";
import type { TicketMessageView } from "#/modules/support/model/support-views";
import { cn } from "#/shared/ui/cn";
import { formatDateTime } from "#/shared/ui/format";

const OWN_NAME = "Você";
const TEAM_INITIALS = "EO";

function TimelineEntry({ message }: { message: TicketMessageView }): ReactNode {
    const isTeam = message.authorKind === "staff";
    let name = OWN_NAME;
    let mark: ReactNode = <UserRoundIcon className="size-4" />;

    if (isTeam === true) {
        name = message.authorName;
        mark = TEAM_INITIALS;
    }

    return (
        <li className="relative grid gap-1.5 ps-12 pb-7 last:pb-0">
            <span
                aria-hidden="true"
                className={cn(
                    "absolute start-0 top-0 grid size-8 place-items-center rounded-full bg-secondary text-xs font-extrabold",
                    isTeam === true && "bg-primary-solid text-primary-foreground",
                )}
            >
                {mark}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-bold">{name}</span>
                {isTeam === true && name !== STAFF_FALLBACK_NAME && (
                    <span className="text-xs font-semibold text-primary-ink">
                        {STAFF_FALLBACK_NAME}
                    </span>
                )}
                <time
                    dateTime={message.createdAt}
                    className="text-meta text-muted-foreground tabular-nums"
                >
                    {formatDateTime(message.createdAt)}
                </time>
            </div>
            <p className="max-w-prose break-words whitespace-pre-wrap">{message.body}</p>
        </li>
    );
}

/** The conversation as a timeline down one line, oldest first, the team's turns marked in lime. */
export function TicketTimeline({
    messages,
}: {
    messages: ReadonlyArray<TicketMessageView>;
}): ReactNode {
    return (
        <ol className="relative grid before:absolute before:inset-y-2 before:start-4 before:w-px before:bg-border">
            {messages.map((message) => (
                <TimelineEntry key={message.id} message={message} />
            ))}
        </ol>
    );
}
