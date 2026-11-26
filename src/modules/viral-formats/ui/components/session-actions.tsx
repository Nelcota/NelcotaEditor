import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { EditSessionView, SessionNote } from "#/modules/viral-formats/model/edit-session";
import { SessionAdjustments } from "#/modules/viral-formats/ui/components/session-adjustments";
import { SessionRequestForm } from "#/modules/viral-formats/ui/components/session-request-form";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import { CopyTextButton } from "#/shared/ui/copy-text-button";

const CLAUDE_REQUEST = "Edite a minha fila do Editor Oculto.";

/** After the batch is sent: what to tell Claude, ready to copy. */
function QueuedForClaude({
    headingRef,
    notes,
}: {
    headingRef: RefObject<HTMLHeadingElement | null>;
    notes: ReadonlyArray<SessionNote>;
}): ReactNode {
    return (
        <div className="grid gap-4">
            <div className="grid gap-1.5">
                <h2
                    ref={headingRef}
                    tabIndex={-1}
                    id="session-actions"
                    className="flex items-center gap-2.5 text-lg leading-tight font-bold"
                >
                    <ClaudeLogo className="size-5 shrink-0" />
                    Continue no Claude
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                    Copie o pedido abaixo e envie no Claude. Os vídeos prontos aparecem nesta
                    página.
                </p>
            </div>
            <div className="grid min-w-0 gap-2">
                <p className="rounded-xl border border-card-border bg-background p-3 text-sm">
                    {CLAUDE_REQUEST}
                </p>
                <CopyTextButton
                    text={CLAUDE_REQUEST}
                    label="Copiar pedido"
                    className="h-11 w-full"
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Precisa de ajuda?{" "}
                <Link
                    to="/claude"
                    className="font-semibold text-primary-ink underline underline-offset-4"
                >
                    Conectar Claude
                </Link>
            </p>
            <SessionAdjustments notes={notes} />
        </div>
    );
}

export function SessionActions({
    session,
    uploadsRunning,
}: {
    session: EditSessionView;
    uploadsRunning: number;
}): ReactNode {
    const isQueued = session.status === "queued";
    const wasQueued = useRef(isQueued);
    const headingRef = useRef<HTMLHeadingElement | null>(null);

    useEffect(() => {
        if (isQueued && wasQueued.current === false) {
            headingRef.current?.focus();
        }

        wasQueued.current = isQueued;
    }, [isQueued]);

    return (
        <section
            aria-labelledby="session-actions"
            className="min-w-0 rounded-2xl border border-card-border bg-card p-4 sm:p-5"
        >
            {isQueued && <QueuedForClaude headingRef={headingRef} notes={session.notes} />}
            {isQueued === false && (
                <SessionRequestForm session={session} uploadsRunning={uploadsRunning} />
            )}
        </section>
    );
}
