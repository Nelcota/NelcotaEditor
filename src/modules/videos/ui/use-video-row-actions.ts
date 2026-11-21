import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVideo, retryVideo } from "#/modules/videos/server/video-functions";
import { toErrorMessage } from "#/modules/videos/ui/to-error-message";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";

const RESUME_FALLBACK_MESSAGE =
    "Não foi possível retomar o vídeo. Confira sua conexão e tente de novo.";
const CANCEL_FALLBACK_MESSAGE =
    "Não foi possível cancelar o vídeo. Confira sua conexão e tente de novo.";

/** Only one of the two can have failed: starting either action resets the other. */
function describeFailure(resumeError: Error | null, cancelError: Error | null): string | null {
    if (resumeError !== null) {
        return toErrorMessage(resumeError, RESUME_FALLBACK_MESSAGE);
    }

    if (cancelError !== null) {
        return toErrorMessage(cancelError, CANCEL_FALLBACK_MESSAGE);
    }

    return null;
}

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
        errorMessage: describeFailure(resumption.error, cancellation.error),
    };
}
