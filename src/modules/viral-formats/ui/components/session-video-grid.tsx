import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MAX_SESSION_VIDEOS } from "#/modules/viral-formats/model/edit-session";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import { removeVideoFromMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { PendingUploadCard } from "#/modules/viral-formats/ui/components/pending-upload-card";
import { SessionDropzone } from "#/modules/viral-formats/ui/components/session-dropzone";
import { SessionVideoCard } from "#/modules/viral-formats/ui/components/session-video-card";
import type { PendingUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const REMOVE_ERROR_MESSAGE = "Não foi possível tirar o vídeo. Tente de novo.";

interface SessionVideoGridProps {
    session: EditSessionView;
    pending: Array<PendingUpload>;
    onFiles: (files: Array<File>) => void;
    onDismiss: (key: string) => void;
    /** Deletes the raw video itself once it left the batch; it belongs to the videos module. */
    deleteVideo: (videoId: string) => Promise<void>;
}

/** The batch's raw videos, the ones still on their way, and room for more while it is open. */
export function SessionVideoGrid(props: SessionVideoGridProps): ReactNode {
    const { session, pending, onFiles, onDismiss, deleteVideo } = props;
    const queryClient = useQueryClient();
    const editsByVideo = new Map(session.edits.map((edit) => [edit.videoId, edit]));
    const remove = useMutation({
        mutationFn: async (videoId: string) => {
            await removeVideoFromMyEditSession({ data: { sessionId: session.id, videoId } });
            await deleteVideo(videoId);
        },
        onSettled: () => invalidateEditSessionQueries(queryClient),
    });

    function toRemoveHandler(videoId: string): (() => void) | null {
        if (session.status !== "collecting") {
            return null;
        }

        return () => remove.mutate(videoId);
    }

    return (
        <div className="grid gap-3">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {session.videos.map((video) => (
                    <SessionVideoCard
                        key={video.id}
                        video={video}
                        edit={editsByVideo.get(video.id)}
                        isRemoving={remove.isPending && remove.variables === video.id}
                        onRemove={toRemoveHandler(video.id)}
                    />
                ))}
                {pending.map((upload) => (
                    <PendingUploadCard
                        key={upload.key}
                        upload={upload}
                        onDismiss={() => onDismiss(upload.key)}
                    />
                ))}
                {session.status === "collecting" &&
                    session.videos.length + pending.length < MAX_SESSION_VIDEOS && (
                        <li>
                            <SessionDropzone variant="tile" onFiles={onFiles} />
                        </li>
                    )}
            </ul>
            {remove.isError === true && (
                <FormAlert message={toErrorMessage(remove.error, REMOVE_ERROR_MESSAGE)} />
            )}
        </div>
    );
}
