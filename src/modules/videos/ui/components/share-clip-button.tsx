import Link2Icon from "~icons/lucide/link-2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setClipSharing } from "#/modules/clips/server/clip-sharing-functions";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { invalidateVideoQueries } from "#/modules/videos/model/video-queries";
import { Button } from "#/shared/ui/button";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { FormAlert } from "#/shared/ui/form-alert";

interface ShareClipButtonProps {
    videoId: string;
    clip: ClipView;
}

/** The copy button for a ready clip; while it renders again the link opens nothing, so say so. */
function SharedLink({ sharePath }: { sharePath: string | null }) {
    if (sharePath === null) {
        return (
            <p className="text-sm text-muted-foreground">
                Link ativo. Ele volta a abrir quando o corte ficar pronto.
            </p>
        );
    }

    return (
        <CopyTextButton
            text={`${window.location.origin}${sharePath}`}
            label="Copiar link"
            className="min-w-36"
        />
    );
}

/** Without a link nobody but the owner can watch the clip; turning it off kills the old link. */
export function ShareClipButton({ videoId, clip }: ShareClipButtonProps) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (isShared: boolean) =>
            setClipSharing({ data: { videoId, clipId: clip.id, isShared } }),
        onSuccess: async () => {
            await invalidateVideoQueries(queryClient);
        },
    });

    if (clip.isShared === false && clip.status !== "done") {
        return null;
    }

    if (clip.isShared === false) {
        return (
            <div className="grid gap-2">
                <Button
                    variant="outline"
                    onClick={() => mutation.mutate(true)}
                    disabled={mutation.isPending}
                    aria-busy={mutation.isPending}
                    className="font-medium"
                >
                    <Link2Icon aria-hidden="true" />
                    Criar link
                </Button>
                {mutation.isError === true && <FormAlert message={mutation.error.message} />}
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <SharedLink sharePath={clip.sharePath} />
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
