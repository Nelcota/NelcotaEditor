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
} from "#/modules/video-records/video-status";
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

/** Why an item is off; the menu only opens on demand, so the reason fits right under the label. */
function MenuItemLabel({ label, isDisabled }: { label: string; isDisabled: boolean }) {
    return (
        <span className="grid">
            {label}
            {isDisabled === true && (
                <span className="text-xs text-muted-foreground">
                    Disponível quando o processamento terminar
                </span>
            )}
        </span>
    );
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
    const isRenameDisabled = isVideoFinished(status) === false;
    const isDeleteDisabled = isVideoWorking(status);

    return (
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
                <Link to="/videos/$videoId" params={{ videoId: video.id }}>
                    <SquareArrowRightUpIcon aria-hidden="true" className="size-5" />
                    Abrir
                </Link>
            </DropdownMenuItem>
            {isVideoResumable(status) === true && (
                <DropdownMenuItem disabled={isPending} onSelect={onResume}>
                    <PlayIcon aria-hidden="true" className="size-5" />
                    Retomar
                </DropdownMenuItem>
            )}
            {isVideoCancellable(status) === true && (
                <DropdownMenuItem disabled={isPending || video.isCancelling} onSelect={onCancel}>
                    <StopCircleIcon aria-hidden="true" className="size-5" />
                    Cancelar processamento
                </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled={isRenameDisabled} onSelect={() => onOpenDialog("rename")}>
                <PenIcon aria-hidden="true" className="size-5" />
                <MenuItemLabel label="Renomear" isDisabled={isRenameDisabled} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                variant="destructive"
                disabled={isDeleteDisabled}
                onSelect={() => onOpenDialog("delete")}
            >
                <TrashBinTrashIcon aria-hidden="true" className="size-5" />
                <MenuItemLabel label="Excluir" isDisabled={isDeleteDisabled} />
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
