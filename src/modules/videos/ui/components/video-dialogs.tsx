import type { VideoSummary } from "#/modules/videos/model/video-views";
import { DeleteVideoDialog } from "#/modules/videos/ui/components/delete-video-dialog";
import { RenameVideoDialog } from "#/modules/videos/ui/components/rename-video-dialog";

export type VideoDialog = "rename" | "delete";

interface VideoDialogsProps {
    video: VideoSummary;
    openDialog: VideoDialog | null;
    onClose: () => void;
}

/** The dialogs a video menu opens; at most one is open at a time. */
export function VideoDialogs({ video, openDialog, onClose }: VideoDialogsProps) {
    // The dialogs only ever ask to close; opening them is the menu's job.
    const closeWhenHidden = (isOpen: boolean): void => {
        if (isOpen === false) {
            onClose();
        }
    };

    return (
        <>
            <RenameVideoDialog
                video={video}
                isOpen={openDialog === "rename"}
                onOpenChange={closeWhenHidden}
            />
            <DeleteVideoDialog
                video={video}
                isOpen={openDialog === "delete"}
                onOpenChange={closeWhenHidden}
            />
        </>
    );
}
