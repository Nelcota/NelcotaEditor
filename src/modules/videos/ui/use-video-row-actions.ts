import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVideo, retryVideo } from "#/modules/videos/server/video-functions";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";

interface VideoRowActions {
    resume: () => void;
    cancel: () => void;
    isPending: boolean;
    errorMessage: string | null;
}

/** Resume and cancel from the list; the row shows the failure inline, next to the status. */
export function useVideoRowActions(videoId: string): VideoRowActions {
    const queryClient = useQueryClient();
    const refreshVideos = async (): Promise<void> => {
        await invalidateVideoQueries(queryClient);
    };
    const resumption = useMutation({
        mutationFn: () => retryVideo({ data: { videoId } }),
        onSuccess: refreshVideos,
    });
    const cancellation = useMutation({
        mutationFn: () => cancelVideo({ data: { videoId } }),
        onSuccess: refreshVideos,
    });
    const failure = resumption.error ?? cancellation.error;

    return {
        resume: () => {
            cancellation.reset();
            resumption.mutate();
        },
        cancel: () => {
            resumption.reset();
            cancellation.mutate();
        },
        isPending: resumption.isPending || cancellation.isPending,
        errorMessage: failure?.message ?? null,
    };
}
