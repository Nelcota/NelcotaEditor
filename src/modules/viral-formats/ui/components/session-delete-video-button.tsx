import TrashIcon from "~icons/lucide/trash-2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SessionVideo } from "#/modules/viral-formats/model/edit-session";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "#/shared/ui/alert-dialog";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const DELETE_ERROR_MESSAGE = "Não foi possível excluir o vídeo. Tente de novo.";

export interface SessionVideoDeletion {
    deleteVideo: (videoId: string) => Promise<void>;
    focusBatch: () => void;
}

export function SessionDeleteVideoButton({
    video,
    deletion,
}: {
    video: SessionVideo;
    deletion: SessionVideoDeletion;
}): ReactNode {
    const { deleteVideo, focusBatch } = deletion;
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const hasDeleted = useRef(false);
    const remove = useMutation({
        mutationFn: () => deleteVideo(video.id),
        onSuccess: async () => {
            hasDeleted.current = true;
            setIsOpen(false);
            await invalidateEditSessionQueries(queryClient);
        },
    });

    function changeOpen(nextIsOpen: boolean): void {
        if (remove.isPending) {
            return;
        }

        if (nextIsOpen) {
            hasDeleted.current = false;
        }

        remove.reset();
        setIsOpen(nextIsOpen);
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={changeOpen}>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    aria-label={`Excluir vídeo ${video.title}`}
                    className="absolute end-2 top-2 grid size-8 place-items-center rounded-full bg-stage/80 text-white outline-none transition-[background-color,scale] hover:bg-stage focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99 pointer-coarse:size-11"
                >
                    <TrashIcon aria-hidden="true" className="size-4" />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent
                className="max-h-dvh overflow-y-auto overscroll-contain"
                onCloseAutoFocus={(event) => {
                    if (hasDeleted.current) {
                        event.preventDefault();
                        focusBatch();
                    }
                }}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        O arquivo <strong>{video.title}</strong> será apagado do Editor Oculto e
                        removido do lote. Para usá-lo de novo, envie o arquivo novamente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {remove.isError && (
                    <FormAlert message={toErrorMessage(remove.error, DELETE_ERROR_MESSAGE)} />
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel>
                    <Button
                        type="button"
                        variant="destructive"
                        isLoading={remove.isPending}
                        loadingLabel="Excluindo…"
                        onClick={() => remove.mutate()}
                    >
                        Excluir vídeo
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
