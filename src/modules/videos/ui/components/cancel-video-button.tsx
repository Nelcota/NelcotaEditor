import CircleStopIcon from "~icons/lucide/circle-stop";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { invalidateVideoQueries } from "#/modules/videos/ui/hooks/video-queries";
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
        <div className="grid shrink-0 justify-items-start gap-2 sm:justify-items-end">
            <Button
                variant="destructive"
                className="h-9 bg-red-600 px-4 font-semibold text-white has-[>svg]:pl-3 has-[>svg]:pr-4 [&_svg:not([class*='size-'])]:size-4.5 not-disabled:hover:bg-red-500"
                onClick={() => cancellation.mutate()}
                isLoading={isCancelling}
                loadingLabel="Cancelando…"
            >
                <CircleStopIcon aria-hidden="true" />
                Cancelar
            </Button>
            {cancellation.isError === true && <FormAlert message={cancellation.error.message} />}
        </div>
    );
}
