import LinkRoundIcon from "~icons/solar/link-round-linear";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setClipSharing } from "#/modules/videos/server/clip-edit-functions";
import type { ClipView } from "#/modules/videos/video-views";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { FormAlert } from "#/shared/ui/form-alert";

interface ShareClipButtonProps {
    videoId: string;
    clip: ClipView;
}

/** Without a link nobody but the owner can watch the clip; turning it off kills the old link. */
export function ShareClipButton({ videoId, clip }: ShareClipButtonProps) {
    const queryClient = useQueryClient();
    const sharePath = clip.sharePath;
    const mutation = useMutation({
        mutationFn: (isShared: boolean) =>
            setClipSharing({ data: { videoId, clipId: clip.id, isShared } }),
        onSuccess: async () => {
            await invalidateVideoQueries(queryClient);
        },
    });

    if (sharePath === null) {
        return (
            <div className="grid gap-2">
                <Button
                    variant="outline"
                    onClick={() => mutation.mutate(true)}
                    disabled={mutation.isPending}
                    aria-busy={mutation.isPending}
                    className="font-semibold"
                >
                    <LinkRoundIcon aria-hidden="true" />
                    Criar link
                </Button>
                {mutation.isError === true && <FormAlert message={mutation.error.message} />}
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <CopyTextButton
                text={`${window.location.origin}${sharePath}`}
                label="Copiar link"
                className="min-w-36"
            />
            <Button
                variant="ghost"
                onClick={() => mutation.mutate(false)}
                disabled={mutation.isPending}
                aria-busy={mutation.isPending}
            >
                Desativar link
            </Button>
            {mutation.isError === true && <FormAlert message={mutation.error.message} />}
        </div>
    );
}
