import { CREW_NAMES } from "#/modules/videos/crew-lines";
import type { CrewStat } from "#/modules/videos/ui/crew-stats";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";

export const STAT_GRID_CLASS = "grid grid-cols-2 gap-3 @3xl:grid-cols-4";

/** The number first, what it counts next, and who on the crew did it in the small print. */
export function CrewStatTile({ stat }: { stat: CrewStat }) {
    return (
        <div className="grid content-start gap-2 rounded-2xl border bg-popover p-4 sm:p-5">
            <StageCrewMascot status={stat.stage} className="size-9" />
            <dd className="text-[32px] leading-none font-extrabold tracking-tight tabular-nums">
                {stat.value}
            </dd>
            <dt className="text-sm font-bold first-letter:uppercase">{stat.label}</dt>
            <dd className="text-xs text-muted-foreground tabular-nums">
                {CREW_NAMES[stat.stage]} · {stat.detail}
            </dd>
        </div>
    );
}
