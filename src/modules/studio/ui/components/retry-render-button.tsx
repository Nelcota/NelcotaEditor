import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { retryClip } from "#/modules/videos/server/video-edit-functions";
import { invalidateVideoQueries } from "#/modules/videos/model/video-queries";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";

interface RetryRenderButtonProps {
    videoId: string;
    clipId: string;
}

/** Sends the clip whose render failed back to Brasa, with the Studio's edits kept. */
export function RetryRenderButton({ videoId, clipId }: RetryRenderButtonProps): ReactNode {
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
                disabled={retry.isPending}
                aria-busy={retry.isPending}
                variant="outline"
                className="font-medium"
            >
                <RotateCwIcon aria-hidden="true" />
                Refazer este corte
            </Button>
            {retry.isError === true && <FormAlert message={retry.error.message} />}
        </div>
    );
}
