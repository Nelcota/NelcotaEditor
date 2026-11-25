import ArrowLeftIcon from "~icons/lucide/arrow-left";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    EDIT_SESSION_STATUS_LABELS,
    toFormatName,
} from "#/modules/viral-formats/model/edit-session";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { editSessionQueryOptions } from "#/modules/viral-formats/model/edit-session-queries";
import { SessionActions } from "#/modules/viral-formats/ui/components/session-actions";
import { SessionAdjustments } from "#/modules/viral-formats/ui/components/session-adjustments";
import { SessionDropzone } from "#/modules/viral-formats/ui/components/session-dropzone";
import { SessionVideoGrid } from "#/modules/viral-formats/ui/components/session-video-grid";
import { useBatchUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import type { UploadFormatVideo } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import { AsyncButton } from "#/shared/ui/async-button";
import { Skeleton } from "#/shared/ui/skeleton";

interface EditSessionScreenProps {
    sessionId: string;
    /** From the videos module, which owns uploads; the route passes it in. */
    uploadVideo: UploadFormatVideo;
    deleteVideo: (videoId: string) => Promise<void>;
}

function SessionHeader({ session }: { session: EditSessionView }): ReactNode {
    return (
        <header className="flex items-start gap-3">
            <Link
                to="/edits"
                aria-label="Voltar para Minhas edições"
                className="grid size-10 shrink-0 place-items-center rounded-xl outline-none transition-[background-color,scale] hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
            >
                <ArrowLeftIcon aria-hidden="true" className="size-5" />
            </Link>
            <div className="grid min-w-0 gap-1">
                <h1 className="text-title font-extrabold tracking-[-0.02em]">{session.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {toFormatName(session.format)} · {EDIT_SESSION_STATUS_LABELS[session.status]}
                </p>
            </div>
        </header>
    );
}

function SessionLoaded(props: EditSessionScreenProps & { session: EditSessionView }): ReactNode {
    const { session, uploadVideo, deleteVideo } = props;
    const { pending, addFiles, dismiss } = useBatchUpload({ sessionId: session.id, uploadVideo });

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid content-start gap-6">
                <SessionHeader session={session} />
                {session.videos.length === 0 &&
                    pending.length === 0 &&
                    session.status === "collecting" && (
                        <SessionDropzone variant="empty" onFiles={addFiles} />
                    )}
                {(session.videos.length > 0 || pending.length > 0) && (
                    <SessionVideoGrid
                        session={session}
                        pending={pending}
                        onFiles={addFiles}
                        onDismiss={dismiss}
                        deleteVideo={deleteVideo}
                    />
                )}
                <SessionActions
                    session={session}
                    uploadsRunning={pending.filter((upload) => upload.errorMessage === null).length}
                />
            </div>
            <aside className="xl:border-s xl:border-border xl:ps-6">
                <SessionAdjustments session={session} />
            </aside>
        </div>
    );
}

/** One batch for a format: the raw videos going in, the adjustments, and sending it to Claude. */
export function EditSessionScreen(props: EditSessionScreenProps): ReactNode {
    const sessionQuery = useQuery(editSessionQueryOptions(props.sessionId));
    const session = sessionQuery.data;

    if (sessionQuery.isError === true && session === undefined) {
        return (
            <div className="grid justify-items-start gap-3">
                <p className="text-muted-foreground">
                    Não foi possível carregar esta edição. Confira sua conexão.
                </p>
                <AsyncButton variant="secondary" onAction={() => sessionQuery.refetch()}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </AsyncButton>
            </div>
        );
    }

    if (session === undefined || session === null) {
        return <Skeleton className="h-96 w-full rounded-2xl" />;
    }

    return <SessionLoaded {...props} session={session} />;
}
