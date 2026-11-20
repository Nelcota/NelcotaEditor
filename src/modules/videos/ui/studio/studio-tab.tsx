import FilmIcon from "~icons/solar/clapperboard-linear";
import RestartIcon from "~icons/solar/restart-linear";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoDetails } from "#/modules/videos/video-views";
import { rankClips } from "#/modules/videos/ui/clip-ranking";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import {
    clipStudioQueryKey,
    clipStudioQueryOptions,
} from "#/modules/videos/ui/studio/studio-queries";
import { StudioWorkspace } from "#/modules/videos/ui/studio/studio-workspace";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

interface StudioTabProps {
    details: VideoDetails;
    /** The clip asked for in the address; the best clip when absent or unknown. */
    clipId: string | undefined;
    onSelectClip: (clipId: string) => void;
    onShowClips: () => void;
}

function StudioLoading(): ReactNode {
    return (
        <div
            aria-busy="true"
            aria-label="Carregando o Studio"
            className="grid grid-cols-[minmax(0,1fr)] gap-4"
        >
            <div className="flex gap-3">
                <Skeleton className="h-10 w-96 max-w-full" />
                <span className="flex-1" />
                <Skeleton className="hidden h-10 w-48 sm:block" />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
                <Skeleton className="hidden h-[560px] rounded-2xl lg:block" />
                <Skeleton className="mx-auto aspect-[9/16] w-full max-w-[300px] rounded-2xl" />
                <Skeleton className="h-[600px] rounded-2xl" />
            </div>
            <Skeleton className="hidden h-40 rounded-2xl lg:block" />
        </div>
    );
}

function NotReady({ details, onShowClips }: Pick<StudioTabProps, "details" | "onShowClips">) {
    return (
        <EmptyState
            art={<StageCrewMascot status={details.video.status} className="size-14" />}
            title="O Studio abre quando os cortes ficarem prontos"
            description="Sem a transcrição e os cortes ainda não dá para editar trecho nem legendas. Acompanhe o andamento em Cortes."
            action={
                <Button variant="secondary" onClick={onShowClips}>
                    <FilmIcon aria-hidden="true" />
                    Acompanhar em Cortes
                </Button>
            }
        />
    );
}

/** The Studio tab: picks the clip, loads what it needs and hands it to the workspace. */
export function StudioTab({ details, clipId, onSelectClip, onShowClips }: StudioTabProps) {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const selectedClip = rankedClips.find((clip) => clip.id === clipId) ?? rankedClips[0];
    const queryClient = useQueryClient();
    const selectedClipId = selectedClip?.id ?? null;
    const studioQuery = useQuery({
        ...clipStudioQueryOptions(video.id, selectedClipId ?? ""),
        enabled: selectedClipId !== null,
    });
    const isFinished = isVideoFinished(video.status);

    // When Brasa finishes, the clip's applied version and file are new.
    useEffect(() => {
        if (isFinished === false || selectedClipId === null) {
            return;
        }

        void queryClient.invalidateQueries({
            queryKey: clipStudioQueryKey(video.id, selectedClipId),
        });
    }, [isFinished, queryClient, video.id, selectedClipId]);

    if (selectedClip === undefined) {
        return <NotReady details={details} onShowClips={onShowClips} />;
    }

    const studio = studioQuery.data;

    if (studioQuery.isError === true && studio === undefined) {
        return (
            <EmptyState
                art={<StageCrewMascot status="failed" className="size-14" />}
                title="Não foi possível abrir o Studio"
                description={studioQuery.error.message}
                action={
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            await studioQuery.refetch();
                        }}
                    >
                        <RestartIcon aria-hidden="true" />
                        Tentar de novo
                    </Button>
                }
            />
        );
    }

    if (studio === undefined) {
        return <StudioLoading />;
    }

    return (
        <StudioWorkspace
            key={selectedClip.id}
            video={video}
            studio={{ ...studio, clip: selectedClip }}
            rankedClips={rankedClips}
            onSelectClip={onSelectClip}
        />
    );
}
