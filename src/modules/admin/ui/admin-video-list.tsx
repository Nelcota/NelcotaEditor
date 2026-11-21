import MenuDotsIcon from "~icons/solar/menu-dots-linear";
import StopCircleIcon from "~icons/solar/stop-circle-linear";
import TrashBinTrashIcon from "~icons/solar/trash-bin-trash-linear";
import UserRoundedIcon from "~icons/solar/user-rounded-linear";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import type { AdminVideoRow } from "#/modules/admin/admin-views";
import { AdminConfirmDialog } from "#/modules/admin/ui/admin-confirm-dialog";
import type { AdminConfirmation } from "#/modules/admin/ui/admin-confirm-dialog";
import { cancelAnyVideo, deleteAnyVideo } from "#/modules/admin/server/admin-video-functions";
import { isVideoCancellable, isVideoWorking } from "#/modules/video-records/video-status";
import { VideoStatusBadge } from "#/modules/videos/ui/video-status-badge";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/ui/video-status-labels";
import { Button } from "#/shared/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import { formatBytes, formatClock, formatDateTime } from "#/shared/ui/format";

function toCancelConfirmation(video: AdminVideoRow): AdminConfirmation {
    return {
        title: "Cancelar o processamento?",
        description: `“${video.title}”, de ${video.ownerName}, para na etapa em que está. A pessoa pode retomar depois.`,
        confirmLabel: "Cancelar processamento",
        isDestructive: false,
        run: async () => {
            await cancelAnyVideo({ data: { videoId: video.id } });
        },
    };
}

function toDeleteConfirmation(video: AdminVideoRow): AdminConfirmation {
    return {
        title: "Excluir este vídeo?",
        description: `“${video.title}”, de ${video.ownerName}, e todos os cortes dele serão apagados. Isso não pode ser desfeito.`,
        confirmLabel: "Excluir vídeo",
        isDestructive: true,
        run: async () => {
            await deleteAnyVideo({ data: { videoId: video.id } });
        },
    };
}

interface VideoMenuProps {
    video: AdminVideoRow;
    showOwner: boolean;
    onConfirm: (confirmation: AdminConfirmation) => void;
}

function VideoMenu({ video, showOwner, onConfirm }: VideoMenuProps): ReactNode {
    const isWorking = isVideoWorking(video.status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Ações de ${video.title}`}>
                    <MenuDotsIcon aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {showOwner === true && (
                    <DropdownMenuItem asChild>
                        <Link to="/admin/users/$userId" params={{ userId: video.ownerId }}>
                            <UserRoundedIcon aria-hidden="true" className="size-5" />
                            Ver conta
                        </Link>
                    </DropdownMenuItem>
                )}
                {isVideoCancellable(video.status) === true && (
                    <DropdownMenuItem onSelect={() => onConfirm(toCancelConfirmation(video))}>
                        <StopCircleIcon aria-hidden="true" className="size-5" />
                        Cancelar processamento
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    disabled={isWorking}
                    onSelect={() => onConfirm(toDeleteConfirmation(video))}
                >
                    <TrashBinTrashIcon aria-hidden="true" className="size-5" />
                    <span className="grid">
                        Excluir vídeo
                        {isWorking === true && (
                            <span className="text-xs text-muted-foreground">
                                Disponível quando o processamento terminar
                            </span>
                        )}
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function describeVideo(video: AdminVideoRow): string {
    const parts = [
        VIDEO_SOURCE_LABELS[video.source],
        `${video.readyClipCount} de ${video.requestedClipCount} cortes`,
        formatBytes(video.storageBytes),
        formatDateTime(video.createdAt),
    ];

    if (video.durationSeconds !== null) {
        parts.splice(1, 0, formatClock(video.durationSeconds));
    }

    return parts.join(" · ");
}

function VideoItem({ video, showOwner, onConfirm }: VideoMenuProps): ReactNode {
    return (
        <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b py-3 last:border-b-0">
            <div className="grid min-w-0 gap-1">
                <p className="font-medium [overflow-wrap:anywhere]">{video.title}</p>
                {showOwner === true && (
                    <Link
                        to="/admin/users/$userId"
                        params={{ userId: video.ownerId }}
                        className="w-fit rounded-sm text-meta text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring/70 [overflow-wrap:anywhere]"
                    >
                        {video.ownerName} · {video.ownerEmail}
                    </Link>
                )}
                <p className="text-xs text-muted-foreground tabular-nums">{describeVideo(video)}</p>
                {video.status === "failed" && video.errorMessage !== null && (
                    <p className="max-w-prose text-meta text-destructive [overflow-wrap:anywhere]">
                        {video.errorMessage}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <VideoStatusBadge status={video.status} />
                <VideoMenu video={video} showOwner={showOwner} onConfirm={onConfirm} />
            </div>
        </li>
    );
}

interface AdminVideoListProps {
    videos: Array<AdminVideoRow>;
    /** Off on a user's own page, where every video has the same owner. */
    showOwner: boolean;
}

export function AdminVideoList({ videos, showOwner }: AdminVideoListProps): ReactNode {
    const [confirmation, setConfirmation] = useState<AdminConfirmation | null>(null);

    return (
        <>
            <ul className="rounded-2xl border bg-popover px-4 sm:px-5">
                {videos.map((video) => (
                    <VideoItem
                        key={video.id}
                        video={video}
                        showOwner={showOwner}
                        onConfirm={setConfirmation}
                    />
                ))}
            </ul>
            <AdminConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
        </>
    );
}
