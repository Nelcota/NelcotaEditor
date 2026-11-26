import SquarePlayIcon from "~icons/lucide/square-play";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { STAFF_FALLBACK_NAME } from "#/modules/support/model/support-ticket";
import type { TicketMessageView, TicketVideo } from "#/modules/support/model/support-views";
import { cn } from "#/shared/ui/cn";
import { formatDateTime } from "#/shared/ui/format";

const appRoute = getRouteApi("/_app");
const OWN_NAME = "Você";
const TEAM_INITIALS = "EO";
const WORD_SEPARATOR = /\s+/u;

/** "Ana Teste" → "AT"; one word keeps its first two letters. */
function toInitials(name: string): string {
    const words = name.trim().split(WORD_SEPARATOR);
    const first = words[0] ?? "";
    const last = words.at(-1) ?? "";

    if (words.length < 2) {
        return first.slice(0, 2).toUpperCase();
    }

    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function VideoChip({ video }: { video: TicketVideo }): ReactNode {
    return (
        <Link
            to="/videos/$videoId"
            params={{ videoId: video.id }}
            className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring [&>svg]:size-4"
        >
            <SquarePlayIcon aria-hidden="true" />
            {video.title}
        </Link>
    );
}

interface TimelineEntryProps {
    message: TicketMessageView;
    ownInitials: string;
    /** The video the conversation is about, shown under the message that opened it. */
    video: TicketVideo | null;
    isOpening: boolean;
}

function TimelineEntry({ message, ownInitials, video, isOpening }: TimelineEntryProps): ReactNode {
    const isTeam = message.authorKind === "staff";
    let name = OWN_NAME;
    let initials = ownInitials;

    if (isTeam === true) {
        name = message.authorName;
        initials = TEAM_INITIALS;
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
                {initials}
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
            {isOpening === true && video !== null && <VideoChip video={video} />}
        </li>
    );
}

interface TicketTimelineProps {
    messages: ReadonlyArray<TicketMessageView>;
    video: TicketVideo | null;
}

/** The conversation down one line, oldest first, the team's turns marked in lime. */
export function TicketTimeline({ messages, video }: TicketTimelineProps): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const ownInitials = toInitials(routeContext.user.name);
    const firstMessageId = messages[0]?.id;

    return (
        <ol className="relative grid before:absolute before:inset-y-2 before:start-4 before:w-px before:bg-border">
            {messages.map((message) => (
                <TimelineEntry
                    key={message.id}
                    message={message}
                    ownInitials={ownInitials}
                    video={video}
                    isOpening={message.id === firstMessageId}
                />
            ))}
        </ol>
    );
}
