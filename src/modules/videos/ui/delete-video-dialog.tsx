import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { deleteVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/video-views";
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

interface DeleteVideoDialogProps {
    video: VideoSummary;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** Deleting is permanent, so it always asks first and names the video. */
export function DeleteVideoDialog({ video, isOpen, onOpenChange }: DeleteVideoDialogProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const deletion = useMutation({
        mutationFn: () => deleteVideo({ data: { videoId: video.id } }),
        onSuccess: async () => {
            onOpenChange(false);
            await invalidateVideoQueries(queryClient);
            await navigate({ to: "/" });
        },
    });

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este vídeo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        “{video.title}” e todos os cortes dele serão apagados. Isso não pode ser
                        desfeito.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {deletion.isError === true && <FormAlert message={deletion.error.message} />}
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
