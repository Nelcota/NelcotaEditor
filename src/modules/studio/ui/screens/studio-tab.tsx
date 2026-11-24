import ClapperboardIcon from "~icons/lucide/clapperboard";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { StudioTabProps } from "#/modules/videos/model/studio-tab-props";
import { rankClips } from "#/modules/videos/model/clip-ranking";
import {
    clipStudioQueryKey,
    clipStudioQueryOptions,
    studioWordsQueryOptions,
} from "#/modules/studio/model/studio-queries";
import { StudioFrame } from "#/modules/studio/ui/components/studio-frame";
import { StudioWorkspace } from "#/modules/studio/ui/components/studio-workspace";
import type { ClipStudioState } from "#/modules/studio/model/clip-studio-view";
import { toClipStudioState } from "#/modules/studio/model/to-clip-studio-state";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { Mascot } from "#/shared/ui/mascot";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

function StudioLoading(): ReactNode {
    return (
        <div
            role="status"
            aria-busy="true"
            className="grid grid-cols-[minmax(0,1fr)] gap-px @4xl/studio:h-full @4xl/studio:grid-cols-[400px_minmax(0,1fr)]"
        >
            <span className="sr-only">Carregando o Studio</span>
            <Skeleton className="order-last h-80 rounded-none @4xl/studio:order-none @4xl/studio:h-full" />
            <Skeleton className="h-[min(46dvh,520px)] rounded-none @4xl/studio:h-full" />
        </div>
    );
}

function NotReady({ details, onShowClips }: Pick<StudioTabProps, "details" | "onShowClips">) {
    return (
        <EmptyState
            art={<Mascot index={STAGE_CREW[details.video.status]} className="size-14" />}
            title="O Studio abre quando os cortes ficarem prontos"
            description="Sem a transcrição e os cortes ainda não dá para editar trecho nem legendas. Acompanhe o andamento em Cortes."
            action={
                <Button variant="secondary" onClick={onShowClips}>
                    <ClapperboardIcon aria-hidden="true" />
                    Acompanhar em Cortes
                </Button>
            }
        />
    );
}

/** The Studio tab: picks the clip, loads what it needs and hands it to the workspace. */
export function StudioTab({ details, clipId, onSelectClip, onShowClips }: StudioTabProps) {
    const track = useTrackPromise();
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const selectedClip = rankedClips.find((clip) => clip.id === clipId) ?? rankedClips[0];
    const queryClient = useQueryClient();
    const selectedClipId = selectedClip?.id ?? null;
    const studioQuery = useQuery({
        ...clipStudioQueryOptions(video.id, selectedClipId ?? ""),
        enabled: selectedClipId !== null,
    });
    // Runs alongside the clip's state, not after it, and is reused when another clip opens.
    const wordsQuery = useQuery({
        ...studioWordsQueryOptions(video.id),
        enabled: selectedClipId !== null,
    });
    const isFinished = isVideoFinished(video.status);
    const snapshot = studioQuery.data;
    const words = wordsQuery.data;
    // The compiler keeps this value while the query data stays the same, so the applied draft
    // keeps its identity between renders.
    let studio: ClipStudioState | undefined = undefined;

    if (snapshot !== undefined && words !== undefined) {
        studio = toClipStudioState(snapshot, words);
    }

    // When Brasa finishes, the clip's applied version and file are new.
    useEffect(() => {
        if (isFinished === false || selectedClipId === null) {
            return;
        }

        track(
            queryClient.invalidateQueries({
                queryKey: clipStudioQueryKey(video.id, selectedClipId),
            }),
        );
    }, [isFinished, queryClient, track, video.id, selectedClipId]);

    if (selectedClip === undefined) {
        return (
            <StudioFrame videoId={video.id} clipId={clipId}>
                <NotReady details={details} onShowClips={onShowClips} />
            </StudioFrame>
        );
    }

    const loadError = studioQuery.error ?? wordsQuery.error;

    if (loadError !== null && (studio === undefined || words === undefined)) {
        return (
            <StudioFrame videoId={video.id} clipId={clipId}>
                <EmptyState
                    art={<Mascot index={STAGE_CREW.failed} className="size-14" />}
                    title="Não foi possível abrir o Studio"
                    description={loadError.message}
                    action={
                        <Button
                            variant="secondary"

                            onClick={() =>
                                track(Promise.all([studioQuery.refetch(), wordsQuery.refetch()]))
                            }
                        >
                            <RotateCwIcon aria-hidden="true" />
                            Tentar de novo
                        </Button>
                    }
                />
            </StudioFrame>
        );
    }

    if (studio === undefined || words === undefined) {
        return (
            <StudioFrame videoId={video.id} clipId={selectedClip.id} isFilling={true}>
                <StudioLoading />
            </StudioFrame>
        );
    }

    return (
        <StudioWorkspace
            key={selectedClip.id}
            video={video}
            studio={{ ...studio, words, clip: selectedClip }}
            rankedClips={rankedClips}
            onSelectClip={onSelectClip}
        />
    );
}
