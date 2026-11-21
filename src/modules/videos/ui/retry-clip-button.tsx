import RestartIcon from "~icons/solar/restart-linear";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ComponentProps, ReactNode } from "react";
import { retryClip } from "#/modules/videos/server/video-edit-functions";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";

interface RetryClipButtonProps {
    videoId: string;
    clipId: string;
    /** The worker is busy with this video, so the clip cannot go back to the queue yet. */
    isDisabled: boolean;
    /** Outline where another filled button is already the view's primary action. */
    variant?: ComponentProps<typeof Button>["variant"];
}

/** Sends one failed clip back to Brasa; the rest of the video stays as it is. */
export function RetryClipButton({
    videoId,
    clipId,
    isDisabled,
    variant = "default",
}: RetryClipButtonProps): ReactNode {
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
                variant={variant}
                className="font-medium"
            >
                <RestartIcon aria-hidden="true" />
                Refazer este corte
            </Button>
            {retry.isError === true && <FormAlert message={retry.error.message} />}
        </div>
    );
}
