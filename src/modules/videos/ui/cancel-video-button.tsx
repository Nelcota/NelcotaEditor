import StopCircleIcon from "~icons/solar/stop-circle-linear";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/video-views";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";

/** Cancelling keeps every finished step, so it never needs a confirmation: "Retomar" continues. */
export function CancelVideoButton({ video }: { video: VideoSummary }) {
    const queryClient = useQueryClient();
    const cancellation = useMutation({
        mutationFn: () => cancelVideo({ data: { videoId: video.id } }),
        onSuccess: async () => {
            await invalidateVideoQueries(queryClient);
        },
    });
    const isCancelling = video.isCancelling || cancellation.isPending;

    return (
        <div className="grid justify-items-start gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => cancellation.mutate()}
                disabled={isCancelling}
                aria-busy={isCancelling}
            >
                <StopCircleIcon aria-hidden="true" />
                {isCancelling === true && "Cancelando…"}
                {isCancelling === false && "Cancelar"}
            </Button>
            {cancellation.isError === true && <FormAlert message={cancellation.error.message} />}
        </div>
    );
}
