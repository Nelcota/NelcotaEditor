import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

interface StageCrewMascotProps {
    status: VideoStatus;
    isWorking?: boolean;
    className?: string;
}

/** Decorative: the stage is always written next to it, so the mascot never carries meaning alone. */
export function StageCrewMascot({ status, isWorking = false, className }: StageCrewMascotProps) {
    return (
        <Mascot
            index={STAGE_CREW[status]}
            className={cn(isWorking === true && "motion-safe:animate-crew-work", className)}
        />
    );
}
