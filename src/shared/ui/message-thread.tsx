import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { formatDateTime } from "#/shared/ui/format";

export interface ThreadMessage {
    id: string;
    authorName: string;
    /** A line under the name, such as the team the author answers for. */
    authorRole: string | null;
    body: string;
    createdAt: string;
    /** The other side's messages sit on a filled card, so the reader tells the voices apart. */
    isHighlighted: boolean;
}

/** A conversation in order, oldest first; the text keeps the line breaks it was written with. */
export function MessageThread({ messages }: { messages: ReadonlyArray<ThreadMessage> }): ReactNode {
    return (
        <ol className="grid max-w-3xl gap-3">
            {messages.map((message) => (
                <li
                    key={message.id}
                    className={cn(
                        "grid gap-1.5 rounded-2xl border px-4 py-3.5",
                        message.isHighlighted === true && "bg-card",
                    )}
                >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold">{message.authorName}</span>
                        {message.authorRole !== null && (
                            <span className="text-xs font-semibold text-primary-ink">
                                {message.authorRole}
                            </span>
                        )}
                        <time
                            dateTime={message.createdAt}
                            className="ms-auto text-xs text-muted-foreground tabular-nums"
                        >
                            {formatDateTime(message.createdAt)}
                        </time>
                    </div>
                    <p className="max-w-prose text-sm break-words whitespace-pre-wrap">
                        {message.body}
                    </p>
                </li>
            ))}
        </ol>
    );
}
