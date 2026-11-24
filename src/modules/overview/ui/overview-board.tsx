import type { ReactNode } from "react";
import type { OverviewStats } from "#/modules/overview/overview-views";
import { BestClipsCarousel } from "#/modules/overview/ui/best-clips-carousel";
import { CREW_STAGES, CrewStageCard } from "#/modules/overview/ui/crew-stage-card";
import { InProgressNotice } from "#/modules/overview/ui/in-progress-notice";
import { ResultsCard } from "#/modules/overview/ui/results-card";
import { TimeAndFailures } from "#/modules/overview/ui/time-and-failures";
import { cn } from "#/shared/ui/cn";

interface OverviewBoardProps {
    stats: OverviewStats;
    /** True while the numbers of the previous period are shown and the new ones load. */
    isStale: boolean;
    onWiden: (() => void) | null;
}

/**
 * The reference's results card first (totals, the ranking and the clips per day), then what each
 * crew member did in the period, time and failures, and the best clips to watch. Columns follow the
 * board's own width (container queries), so a narrow window does not squeeze them.
 */
export function OverviewBoard({ stats, isStale, onWiden }: OverviewBoardProps): ReactNode {
    const videosSent = stats.metrics.videosSent;

    return (
        <div
            className={cn(
                "@container grid gap-8 transition-opacity",
                isStale === true && "opacity-55",
            )}
            aria-busy={isStale}
        >
            <InProgressNotice count={stats.inProgressCount} />
            <ResultsCard stats={stats} />
            {videosSent.previous === 0 && (
                <p className="text-sm text-muted-foreground">
                    Nada no período anterior para comparar: as variações aparecem a partir do
                    próximo período.
                </p>
            )}
            <section aria-labelledby="crew-title" className="grid gap-3">
                <h2 id="crew-title" className="text-lg font-semibold">
                    O que a turma fez no período
                </h2>
                <ol className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
                    {CREW_STAGES.map((stage) => (
                        <CrewStageCard key={stage.status} stage={stage} stats={stats} />
                    ))}
                </ol>
            </section>
            <TimeAndFailures stats={stats} />
            <BestClipsCarousel clips={stats.bestClips} onWiden={onWiden} />
        </div>
    );
}
