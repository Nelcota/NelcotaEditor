import ArrowLeftIcon from "~icons/lucide/arrow-left";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { editSessionQueryOptions } from "#/modules/viral-formats/model/edit-session-queries";
import { SessionActions } from "#/modules/viral-formats/ui/components/session-actions";
import { SessionVideos } from "#/modules/viral-formats/ui/components/session-videos";
import { useBatchUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import type { UploadFormatVideo } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import { AsyncButton } from "#/shared/ui/async-button";
import { Button } from "#/shared/ui/button";
import { Skeleton } from "#/shared/ui/skeleton";

interface EditSessionScreenProps {
    sessionId: string;
    /** From the videos module, which owns uploads; the route passes it in. */
    uploadVideo: UploadFormatVideo;
    deleteVideo: (videoId: string) => Promise<void>;
}

function SessionHeader({ session }: { session: EditSessionView }): ReactNode {
    const isQueued = session.status === "queued";

    return (
        <header className="grid min-w-0 justify-items-start gap-3">
            <Button
                asChild
                variant="ghost"
                className="min-h-11 text-muted-foreground has-[>svg]:pe-7 has-[>svg]:ps-0"
            >
                <Link to="/edits">
                    <ArrowLeftIcon aria-hidden="true" className="size-4" viewBox="4 0 24 24" />
                    Minhas edições
                </Link>
            </Button>
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="text-title font-extrabold tracking-tight">{session.title}</h1>
                <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {isQueued && "Na fila do Claude"}
                    {isQueued === false && "Rascunho"}
                </span>
            </div>
        </header>
    );
}

function SessionLoaded(props: EditSessionScreenProps & { session: EditSessionView }): ReactNode {
    const { session, uploadVideo, deleteVideo } = props;
    const { pending, addFiles, dismiss } = useBatchUpload({
        sessionId: session.id,
        videoCount: session.videos.length,
        uploadVideo,
        deleteVideo,
    });
    const uploadsRunning = pending.filter((upload) => upload.errorMessage === null).length;

    return (
        <div className="@container/session grid min-w-0 gap-6">
            <SessionHeader session={session} />
            <div className="grid min-w-0 items-start gap-5 @4xl/session:grid-cols-[minmax(0,1fr)_20rem]">
                <SessionVideos
                    session={session}
                    pending={pending}
                    uploadsRunning={uploadsRunning}
                    onFiles={addFiles}
                    onDismiss={dismiss}
                    deleteVideo={deleteVideo}
                />
                <SessionActions session={session} uploadsRunning={uploadsRunning} />
            </div>
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
