import { Fragment } from "react";
import { CREW_NAMES } from "#/modules/videos/crew-lines";
import type { VideoStatus } from "#/modules/video-records/video-status";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";

const WORKING_STAGES: ReadonlyArray<VideoStatus> = [
    "downloading",
    "transcribing",
    "selecting",
    "rendering",
];

/** Who takes the video next, in order; decorative, the button next to it says what happens. */
export function CrewLineup() {
    return (
        <p
            aria-label="A equipe: Faísca, Tinta, Brilho e Brasa"
            className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[14px] whitespace-nowrap text-muted-foreground"
        >
            {WORKING_STAGES.map((stage, index) => (
                <Fragment key={stage}>
                    {index > 0 && (
                        <span aria-hidden="true" className="opacity-40">
                            ›
                        </span>
                    )}
                    <StageCrewMascot status={stage} className="size-5 shrink-0" />
                    <span aria-hidden="true" className="hidden sm:inline">
                        {CREW_NAMES[stage]}
                    </span>
                </Fragment>
            ))}
        </p>
    );
}
