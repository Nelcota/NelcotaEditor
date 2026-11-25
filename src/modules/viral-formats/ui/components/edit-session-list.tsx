import ChevronRightIcon from "~icons/lucide/chevron-right";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EDIT_SESSION_STATUS_LABELS } from "#/modules/viral-formats/model/edit-session";
import type {
    EditSessionStatus,
    EditSessionSummary,
} from "#/modules/viral-formats/model/edit-session";
import { formatDate } from "#/shared/ui/format";
import { pluralize } from "#/shared/ui/pluralize";
import { StatusBadge } from "#/shared/ui/status-badge";
import type { StatusTone } from "#/shared/ui/status-badge";

const STATUS_TONES: Readonly<Record<EditSessionStatus, StatusTone>> = {
    collecting: "waiting",
    queued: "working",
};

function SessionRow({ session }: { session: EditSessionSummary }): ReactNode {
    const videoCount = session.videoCount;

    return (
        <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-card-border bg-card p-4 transition-[background-color,scale] has-[a:hover]:bg-accent has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-ring motion-safe:has-[a:active]:scale-99">
            <div className="grid min-w-0 gap-1">
                <Link
                    to="/edits/$sessionId"
                    params={{ sessionId: session.id }}
                    className="font-bold outline-none after:absolute after:inset-0 after:rounded-2xl [overflow-wrap:anywhere]"
                >
                    {session.title}
                </Link>
                <p className="text-meta text-muted-foreground tabular-nums">
                    {videoCount} {pluralize(videoCount, "vídeo", "vídeos")} ·{" "}
                    {formatDate(session.createdAt)}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge
                    tone={STATUS_TONES[session.status]}
                    label={EDIT_SESSION_STATUS_LABELS[session.status]}
                />
                <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
        </li>
    );
}

/** The person's batches, newest first, each opening its page. */
export function EditSessionList({
    sessions,
}: {
    sessions: ReadonlyArray<EditSessionSummary>;
}): ReactNode {
    return (
        <ul className="grid gap-3">
            {sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
            ))}
        </ul>
    );
}
