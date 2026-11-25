import PlayIcon from "~icons/lucide/play";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { Link } from "@tanstack/react-router";
import type { ReactNode, RefObject } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { invalidateVideoQueries } from "#/modules/videos/model/video-queries";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { RESUME_FALLBACK_MESSAGE } from "#/modules/videos/model/video-action-messages";

interface PanelCopy {
    title: string;
    fallbackDescription: string;
    actionLabel: string;
    actionIcon: IconComponent;
    className: string;
}

const FAILED_COPY: PanelCopy = {
    title: "Não deu certo desta vez",
    fallbackDescription:
        "O processamento parou antes do fim. Tente de novo; se falhar outra vez, envie o vídeo de novo.",
    actionLabel: "Tentar de novo",
    actionIcon: RotateCwIcon,
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

interface ResumePanelProps {
    video: VideoSummary;
    mascotRef: RefObject<HTMLSpanElement | null>;
}

/** Shown for failed and cancelled videos: resuming keeps every step that already finished. */
export function ResumePanel({ video, mascotRef }: ResumePanelProps): ReactNode {
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
            <span ref={mascotRef} className="inline-flex w-fit shrink-0 origin-bottom">
                <StageCrewMascot status={video.status} className="size-12" />
            </span>
            <div className="flex-1">
                <p className="font-medium">{copy.title}</p>
                <p className="text-sm text-muted-foreground">
                    {video.errorMessage ?? copy.fallbackDescription}
                </p>
                {resume.isError === true && (
                    <FormAlert message={toErrorMessage(resume.error, RESUME_FALLBACK_MESSAGE)} />
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => resume.mutate()}
                    disabled={resume.isPending}
                    aria-busy={resume.isPending}
                >
                    <ActionIcon aria-hidden="true" />
                    {copy.actionLabel}
                </Button>
                {/* The ticket starts with this video picked, so the team sees what failed. */}
                {video.status === "failed" && (
                    <Button asChild variant="outline">
                        <Link to="/support/new" search={{ videoId: video.id }}>
                            Relatar problema
                        </Link>
                    </Button>
                )}
            </div>
        </section>
    );
}
