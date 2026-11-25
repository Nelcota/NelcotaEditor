import type { ReactNode } from "react";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { useCrewGesture } from "#/modules/videos/ui/hooks/use-crew-gesture";
import type { CrewGestureContext } from "#/modules/videos/ui/hooks/use-crew-gesture";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

const STAGE_MOTION: Partial<Record<VideoStatus, string>> = {
    downloading: "crew-motion:animate-crew-download",
    transcribing: "crew-motion:origin-bottom crew-motion:animate-crew-transcribe",
    selecting: "crew-motion:animate-crew-select",
    rendering: "crew-motion:origin-bottom crew-motion:animate-crew-render",
};

interface StageCrewMascotProps {
    status: VideoStatus;
    isWorking?: boolean;
    isMotionRequested?: boolean;
    context?: CrewGestureContext;
    className?: string;
}

/** Decorative: the stage is always written next to it, so the mascot never carries meaning alone. */
export function StageCrewMascot({
    status,
    isWorking = false,
    isMotionRequested = false,
    context = "inline",
    className,
}: StageCrewMascotProps): ReactNode {
    const motion = STAGE_MOTION[status];
    const gesture = useCrewGesture(status, isWorking === true && motion !== undefined, {
        context,
        isMotionRequested,
    });

    return (
        <Mascot
            key={gesture}
            index={STAGE_CREW[status]}
            className={cn(
                isWorking === true && motion,
                isWorking === true && isMotionRequested === true && "crew-motion-requested",
                className,
            )}
        />
    );
}
