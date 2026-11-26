import type { ReactNode } from "react";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { PendingUploadCard } from "#/modules/viral-formats/ui/components/pending-upload-card";
import type { SessionVideoDeletion } from "#/modules/viral-formats/ui/components/session-delete-video-button";
import { SessionVideoCard } from "#/modules/viral-formats/ui/components/session-video-card";
import type { PendingUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";

interface SessionVideoGridProps {
    session: EditSessionView;
    pending: Array<PendingUpload>;
    onDismiss: (key: string) => void;
    deletion: SessionVideoDeletion | null;
}

/** The batch's raw videos and the ones still on their way. */
export function SessionVideoGrid(props: SessionVideoGridProps): ReactNode {
    const { session, pending, onDismiss, deletion } = props;
    const editsByVideo = new Map(session.edits.map((edit) => [edit.videoId, edit]));

    return (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 @lg/videos:grid-cols-3 @2xl/videos:grid-cols-4">
            {session.videos.map((video) => (
                <SessionVideoCard
                    key={video.id}
                    video={video}
                    edit={editsByVideo.get(video.id)}
                    deletion={deletion}
                />
            ))}
            {pending.map((upload) => (
                <PendingUploadCard
                    key={upload.key}
                    upload={upload}
                    onDismiss={() => onDismiss(upload.key)}
                />
            ))}
        </ul>
    );
}
