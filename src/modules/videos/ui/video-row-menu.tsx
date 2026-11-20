import StopCircleIcon from "~icons/solar/stop-circle-linear";
import MenuDotsIcon from "~icons/solar/menu-dots-linear";
import SquareArrowRightUpIcon from "~icons/solar/square-arrow-right-up-linear";
import PenIcon from "~icons/solar/pen-linear";
import PlayIcon from "~icons/solar/play-linear";
import TrashBinTrashIcon from "~icons/solar/trash-bin-trash-linear";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
    isVideoCancellable,
    isVideoFinished,
    isVideoResumable,
    isVideoWorking,
} from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoDialogs } from "#/modules/videos/ui/video-dialogs";
import type { VideoDialog } from "#/modules/videos/ui/video-dialogs";
import { Button } from "#/shared/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";

interface VideoRowMenuProps {
    video: VideoSummary;
    onResume: () => void;
    onCancel: () => void;
    isPending: boolean;
}

interface VideoRowMenuItemsProps extends VideoRowMenuProps {
    onOpenDialog: (dialog: VideoDialog) => void;
}

function VideoRowMenuItems({
    video,
    onResume,
    onCancel,
    isPending,
    onOpenDialog,
}: VideoRowMenuItemsProps) {
    const status = video.status;

    return (
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
                <Link to="/videos/$videoId" params={{ videoId: video.id }}>
                    <SquareArrowRightUpIcon aria-hidden="true" />
                    Abrir
                </Link>
            </DropdownMenuItem>
            {isVideoResumable(status) === true && (
                <DropdownMenuItem disabled={isPending} onSelect={onResume}>
                    <PlayIcon aria-hidden="true" />
                    Retomar
                </DropdownMenuItem>
            )}
            {isVideoCancellable(status) === true && (
                <DropdownMenuItem disabled={isPending || video.isCancelling} onSelect={onCancel}>
                    <StopCircleIcon aria-hidden="true" />
                    Cancelar processamento
                </DropdownMenuItem>
            )}
            <DropdownMenuItem
                disabled={isVideoFinished(status) === false}
                onSelect={() => onOpenDialog("rename")}
            >
                <PenIcon aria-hidden="true" />
                Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                variant="destructive"
                disabled={isVideoWorking(status)}
                onSelect={() => onOpenDialog("delete")}
            >
                <TrashBinTrashIcon aria-hidden="true" />
                Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}

export function VideoRowMenu(props: VideoRowMenuProps) {
    const [openDialog, setOpenDialog] = useState<VideoDialog | null>(null);
    const video = props.video;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ações para ${video.title}`}
                        aria-busy={props.isPending}
                        className="text-muted-foreground"
                    >
                        <MenuDotsIcon aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <VideoRowMenuItems {...props} onOpenDialog={setOpenDialog} />
            </DropdownMenu>
            <VideoDialogs
                video={video}
                openDialog={openDialog}
                onClose={() => setOpenDialog(null)}
            />
        </>
    );
}
