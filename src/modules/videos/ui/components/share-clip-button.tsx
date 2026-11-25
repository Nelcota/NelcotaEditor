import Link2Icon from "~icons/lucide/link-2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readSwitchState } from "#/modules/app-switches/model/app-switch";
import { appSwitchStatesQueryOptions } from "#/modules/app-switches/model/app-switch-queries";
import { FEATURE_TURNED_OFF_MESSAGES } from "#/modules/app-switches/model/feature-turned-off-error";
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

interface SharedLinkProps {
    sharePath: string | null;
    isSharingOn: boolean;
}

/** The copy button for a ready clip; while it renders again the link opens nothing, so say so. */
function SharedLink({ sharePath, isSharingOn }: SharedLinkProps) {
    if (isSharingOn === false) {
        return (
            <p className="text-sm text-muted-foreground">
                {FEATURE_TURNED_OFF_MESSAGES["clip-sharing"]} O link volta a abrir quando ele for
                retomado.
            </p>
        );
    }

    if (sharePath === null) {
        return (
            <p className="text-sm text-muted-foreground">
                Link ativo. Ele volta a abrir quando o corte ficar pronto.
            </p>
        );
    }

    return (
        <CopyTextButton
            text={() => new URL(sharePath, window.location.origin).href}
            label="Copiar link"
            className="min-w-36"
        />
    );
}

/** Without a link nobody but the owner can watch the clip; turning it off kills the old link. */
export function ShareClipButton({ videoId, clip }: ShareClipButtonProps) {
    const queryClient = useQueryClient();
    const { data: switches } = useQuery(appSwitchStatesQueryOptions());
    const isSharingOn = readSwitchState(switches, "clip-sharing");
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

    if (clip.isShared === false && isSharingOn === false) {
        return (
            <p className="text-sm text-muted-foreground">
                {FEATURE_TURNED_OFF_MESSAGES["clip-sharing"]}
            </p>
        );
    }

    if (clip.isShared === false) {
        return (
            <div className="contents">
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
                {mutation.isError === true && (
                    <div className="basis-full">
                        <FormAlert message={mutation.error.message} />
                    </div>
                )}
            </div>
        );
    }

    // The actions sit in one wrapping row, so these join it instead of stacking under each other.
    return (
        <div className="contents">
            <SharedLink sharePath={clip.sharePath} isSharingOn={isSharingOn} />
            <Button
                variant="ghost"
                onClick={() => mutation.mutate(false)}
                disabled={mutation.isPending}
                aria-busy={mutation.isPending}
            >
                Desativar link
            </Button>
            {mutation.isSuccess === true && mutation.variables === true && (
                <p role="status" className="self-center text-sm text-muted-foreground">
                    Link criado
                </p>
            )}
            {mutation.isError === true && (
                <div className="basis-full">
                    <FormAlert message={mutation.error.message} />
                </div>
            )}
        </div>
    );
}
