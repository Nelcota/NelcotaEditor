import PlayIcon from "~icons/solar/play-linear";
import RestartIcon from "~icons/solar/restart-linear";
import type { IconComponent } from "#/shared/ui/icon-component";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/video-views";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";

interface PanelCopy {
    title: string;
    fallbackDescription: string;
    actionLabel: string;
    actionIcon: IconComponent;
    className: string;
}

const FAILED_COPY: PanelCopy = {
    title: "Não deu certo desta vez",
    fallbackDescription: "Algo deu errado durante o processamento.",
    actionLabel: "Tentar de novo",
    actionIcon: RestartIcon,
    className: "border-destructive/40 bg-destructive/10",
};

const CANCELLED_COPY: PanelCopy = {
    title: "Processamento cancelado",
    fallbackDescription:
        "Cogu guardou as etapas que já terminaram. Retome para continuar de onde parou.",
    actionLabel: "Retomar",
    actionIcon: PlayIcon,
    className: "bg-popover",
};

function resolveCopy(video: VideoSummary): PanelCopy {
    if (video.status === "cancelled") {
        return CANCELLED_COPY;
    }

    return FAILED_COPY;
}

/** Shown for failed and cancelled videos: resuming keeps every step that already finished. */
export function ResumePanel({ video }: { video: VideoSummary }) {
    const queryClient = useQueryClient();
    const resume = useMutation({
        mutationFn: () => retryVideo({ data: { videoId: video.id } }),
        onSuccess: async () => {
            await invalidateVideoQueries(queryClient);
        },
    });
    const copy = resolveCopy(video);
    const ActionIcon = copy.actionIcon;

    return (
        <section
            role="status"
            className={cn(
                "flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center",
                copy.className,
            )}
        >
            <StageCrewMascot status={video.status} className="size-12" />
            <div className="flex-1">
                <p className="font-semibold">{copy.title}</p>
                <p className="text-sm text-muted-foreground">
                    {video.errorMessage ?? copy.fallbackDescription}
                </p>
                {resume.isError === true && <FormAlert message={resume.error.message} />}
            </div>
            <Button
                onClick={() => resume.mutate()}
                disabled={resume.isPending}
                aria-busy={resume.isPending}
            >
                <ActionIcon aria-hidden="true" />
                {copy.actionLabel}
            </Button>
        </section>
    );
}
