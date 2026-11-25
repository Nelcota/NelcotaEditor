import type { ReactNode } from "react";
import type { ClipStatus } from "#/modules/clips/model/clip-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { cn } from "#/shared/ui/cn";
import {
    CLIP_FRAME_CLASS,
    VerticalClipPlayer,
} from "#/shared/ui/media-player/vertical-clip-player";

/** A clip that is not ready shows the crew member on its stage. */
const CLIP_STAGE: Record<ClipStatus, VideoStatus> = {
    pending: "queued",
    rendering: "rendering",
    done: "done",
    failed: "failed",
};

const NOT_READY_LABELS: Record<ClipStatus, string> = {
    pending: "Na fila",
    rendering: "Montando o corte",
    done: "",
    failed: "Não deu para renderizar",
};

/** The clip itself when ready; otherwise the crew member and what is going on. */
export function ClipPreview({ clip }: { clip: ClipView }): ReactNode {
    const fileUrl = clip.fileUrl;

    if (fileUrl !== null) {
        return <VerticalClipPlayer label={`Corte: ${clip.title}`} fileUrl={fileUrl} />;
    }

    return (
        <div
            className={cn(
                CLIP_FRAME_CLASS,
                "flex flex-col items-center justify-center gap-2 p-3 text-center text-xs font-medium",
                clip.status === "failed" && "bg-destructive/10 text-destructive",
                clip.status !== "failed" && "bg-muted/60 text-muted-foreground",
            )}
        >
            <StageCrewMascot
                status={CLIP_STAGE[clip.status]}
                isWorking={clip.status === "rendering"}
                className="size-10"
            />
            {NOT_READY_LABELS[clip.status]}
        </div>
    );
}
