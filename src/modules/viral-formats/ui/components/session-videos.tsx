import { useRef } from "react";
import type { ReactNode } from "react";
import { MAX_SESSION_VIDEOS } from "#/modules/viral-formats/model/edit-session";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import type { SessionVideoDeletion } from "#/modules/viral-formats/ui/components/session-delete-video-button";
import { SessionDropzone } from "#/modules/viral-formats/ui/components/session-dropzone";
import { SessionVideoGrid } from "#/modules/viral-formats/ui/components/session-video-grid";
import type { PendingUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";

interface SessionVideosProps {
    session: EditSessionView;
    pending: Array<PendingUpload>;
    uploadsRunning: number;
    onFiles: (files: Array<File>) => void;
    onDismiss: (key: string) => void;
    deleteVideo: (videoId: string) => Promise<void>;
}

export function SessionVideos(props: SessionVideosProps): ReactNode {
    const { session, pending, uploadsRunning, onFiles, onDismiss, deleteVideo } = props;
    const videoCount = session.videos.length;
    const hasFiles = videoCount > 0 || pending.length > 0;
    const isCollecting = session.status === "collecting";
    const hasRoom = videoCount + uploadsRunning < MAX_SESSION_VIDEOS;
    const headingRef = useRef<HTMLHeadingElement | null>(null);
    let deletion: SessionVideoDeletion | null = null;

    if (isCollecting) {
        deletion = { deleteVideo, focusBatch: () => headingRef.current?.focus() };
    }

    return (
        <section
            aria-labelledby="session-videos"
            className="@container/videos grid min-w-0 gap-5 rounded-2xl border border-card-border bg-card p-4 sm:p-5"
        >
            <div className="grid items-center gap-x-4 gap-y-3 @sm/videos:grid-cols-[minmax(0,1fr)_auto]">
                <div className="grid gap-1">
                    <h2
                        ref={headingRef}
                        id="session-videos"
                        tabIndex={-1}
                        className="rounded-sm text-lg leading-tight font-bold focus-visible:ring-4 focus-visible:ring-ring"
                    >
                        Vídeos do lote
                    </h2>
                    <p role="status" className="text-xs text-muted-foreground tabular-nums">
                        {videoCount} de {MAX_SESSION_VIDEOS} vídeos adicionados
                    </p>
                </div>
                {isCollecting && hasFiles && hasRoom && (
                    <SessionDropzone variant="compact" onFiles={onFiles} />
                )}
            </div>
            {isCollecting && hasFiles === false && (
                <SessionDropzone variant="empty" onFiles={onFiles} />
            )}
            {hasFiles && (
                <SessionVideoGrid
                    session={session}
                    pending={pending}
                    onDismiss={onDismiss}
                    deletion={deletion}
                />
            )}
            {isCollecting === false && hasFiles === false && (
                <p className="text-sm text-muted-foreground">Este lote está sem vídeos.</p>
            )}
        </section>
    );
}
