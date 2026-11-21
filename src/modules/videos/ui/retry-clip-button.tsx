import RestartIcon from "~icons/solar/restart-linear";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryClip } from "#/modules/videos/server/video-edit-functions";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";

interface RetryClipButtonProps {
    videoId: string;
    clipId: string;
    /** The worker is busy with this video, so the clip cannot go back to the queue yet. */
    isDisabled: boolean;
}

/** Sends one failed clip back to Brasa; the rest of the video stays as it is. */
export function RetryClipButton({ videoId, clipId, isDisabled }: RetryClipButtonProps) {
    const queryClient = useQueryClient();
    const retry = useMutation({
        mutationFn: () => retryClip({ data: { videoId, clipId } }),
        onSuccess: async () => {
            await invalidateVideoQueries(queryClient);
        },
    });

    return (
        <div className="grid gap-2">
            <Button
                onClick={() => retry.mutate()}
                disabled={isDisabled || retry.isPending}
                aria-busy={retry.isPending}
                className="font-semibold"
            >
                <RestartIcon aria-hidden="true" />
                Refazer este corte
            </Button>
            {retry.isError === true && <FormAlert message={retry.error.message} />}
        </div>
    );
}
