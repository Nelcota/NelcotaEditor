import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { deleteVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/video-views";
import { toErrorMessage } from "#/modules/videos/ui/to-error-message";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "#/shared/ui/alert-dialog";
import { FormAlert } from "#/shared/ui/form-alert";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível excluir o vídeo. Confira sua conexão e tente de novo.";

/** The card and its menu button are gone after a delete, so focus goes to the page content. */
function focusMainContent(event: Event): void {
    const main = document.getElementById("main");

    if (main === null) {
        return;
    }

    event.preventDefault();
    main.focus();
}

interface DeleteVideoDialogProps {
    video: VideoSummary;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** Deleting is permanent, so it always asks first and names the video. */
export function DeleteVideoDialog({ video, isOpen, onOpenChange }: DeleteVideoDialogProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // A ref, not mutation state: the dialog closes inside onSuccess, before isSuccess turns true.
    const hasDeletedRef = useRef(false);
    const deletion = useMutation({
        mutationFn: () => deleteVideo({ data: { videoId: video.id } }),
        onSuccess: async () => {
            hasDeletedRef.current = true;
            onOpenChange(false);
            await invalidateVideoQueries(queryClient);
            await navigate({ to: "/" });
        },
    });

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent
                onCloseAutoFocus={(event) => {
                    if (hasDeletedRef.current === true) {
                        focusMainContent(event);
                    }
                }}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este vídeo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        “{video.title}” e todos os cortes dele serão apagados. Isso não pode ser
                        desfeito.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {deletion.isError === true && (
                    <FormAlert message={toErrorMessage(deletion.error, FALLBACK_ERROR_MESSAGE)} />
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={deletion.isPending}
                        aria-busy={deletion.isPending}
                        onClick={(event) => {
                            event.preventDefault();
                            deletion.mutate();
                        }}
                    >
                        Excluir vídeo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
