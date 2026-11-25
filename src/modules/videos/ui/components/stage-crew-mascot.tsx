import type { ReactNode } from "react";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

const STAGE_MOTION: Partial<Record<VideoStatus, string>> = {
    downloading: "mascot-motion:motion-safe:animate-crew-download",
    transcribing:
        "mascot-motion:motion-safe:origin-bottom mascot-motion:motion-safe:animate-crew-transcribe",
    selecting: "mascot-motion:motion-safe:animate-crew-select",
    rendering:
        "mascot-motion:motion-safe:origin-bottom mascot-motion:motion-safe:animate-crew-render",
};

interface StageCrewMascotProps {
    status: VideoStatus;
    isWorking?: boolean;
    context?: "inline" | "panel";
    className?: string;
}

/** Decorative: the stage is always written next to it, so the mascot never carries meaning alone. */
export function StageCrewMascot({
    status,
    isWorking = false,
    context = "inline",
    className,
}: StageCrewMascotProps): ReactNode {
    const motion = STAGE_MOTION[status];

    return (
        <Mascot
            index={STAGE_CREW[status]}
            className={cn(
                isWorking === true && motion,
                isWorking === false &&
                    context === "panel" &&
                    "mascot-motion:motion-safe:animate-crew-idle",
                (context === "panel" || (isWorking === true && motion !== undefined)) &&
                    "mascot-animation",
                className,
            )}
        />
    );
}
