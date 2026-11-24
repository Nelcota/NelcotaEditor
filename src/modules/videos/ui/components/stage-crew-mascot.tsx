import type { ReactNode } from "react";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { useCrewGesture } from "#/modules/videos/ui/hooks/use-crew-gesture";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

const STAGE_MOTION: Partial<Record<VideoStatus, string>> = {
    queued: "motion-safe:animate-crew-work",
    downloading: "motion-safe:animate-crew-download",
    transcribing: "motion-safe:origin-bottom motion-safe:animate-crew-transcribe",
    selecting: "motion-safe:animate-crew-select",
    rendering: "motion-safe:origin-bottom motion-safe:animate-crew-render",
};

interface StageCrewMascotProps {
    status: VideoStatus;
    isWorking?: boolean;
    className?: string;
}

/** Decorative: the stage is always written next to it, so the mascot never carries meaning alone. */
export function StageCrewMascot({
    status,
    isWorking = false,
    className,
}: StageCrewMascotProps): ReactNode {
    const motion = STAGE_MOTION[status];
    const gesture = useCrewGesture(status, isWorking === true && motion !== undefined);

    return (
        <Mascot
            key={gesture}
            index={STAGE_CREW[status]}
            className={cn(isWorking === true && motion, className)}
        />
    );
}
