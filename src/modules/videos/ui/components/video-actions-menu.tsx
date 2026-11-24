import EllipsisIcon from "~icons/lucide/ellipsis";
import PenIcon from "~icons/lucide/pen";
import TrashIcon from "~icons/lucide/trash";
import { useState } from "react";
import { isVideoFinished, isVideoWorking } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { VideoDialogs } from "#/modules/videos/ui/components/video-dialogs";
import type { VideoDialog } from "#/modules/videos/ui/components/video-dialogs";
import { Button } from "#/shared/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";

/**
 * Rare, destructive actions live behind "⋯" instead of floating in the header. Hidden while the
 * worker uses the files: cancelling is the action available then.
 */
export function VideoActionsMenu({ video }: { video: VideoSummary }) {
    const [openDialog, setOpenDialog] = useState<VideoDialog | null>(null);
    const status = video.status;

    if (isVideoWorking(status) === true) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Mais ações do vídeo">
                        <EllipsisIcon aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        disabled={isVideoFinished(status) === false}
                        onSelect={() => setOpenDialog("rename")}
                    >
                        <PenIcon aria-hidden="true" />
                        Renomear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setOpenDialog("delete")}
                    >
                        <TrashIcon aria-hidden="true" />
                        Excluir vídeo
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <VideoDialogs
                video={video}
                openDialog={openDialog}
                onClose={() => setOpenDialog(null)}
            />
        </>
    );
}
