import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { OverviewStats } from "#/modules/overview/overview-views";
import { BestClipsCarousel } from "#/modules/overview/ui/best-clips-carousel";
import { CompactMetric } from "#/modules/overview/ui/compact-metric";
import { CREW_STAGES, CrewStageCard } from "#/modules/overview/ui/crew-stage-card";
import { CumulativeClipsChart } from "#/modules/overview/ui/cumulative-clips-chart";
import { InProgressNotice } from "#/modules/overview/ui/in-progress-notice";
import { findMetricDefinition } from "#/modules/overview/ui/metric-definitions";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { cn } from "#/shared/ui/cn";

interface OverviewBoardProps {
    stats: OverviewStats;
    /** True while the numbers of the previous period are shown and the new ones load. */
    isStale: boolean;
    onWiden: (() => void) | null;
}

function FailedVideosLink(): ReactNode {
    return (
        <Link
            to="/"
            search={{ status: "failed" }}
            className="w-fit rounded text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:outline-none motion-safe:active:scale-[0.99]"
        >
            Ver vídeos com falha
        </Link>
    );
}

function TimeAndFailures({ stats }: { stats: OverviewStats }): ReactNode {
    const metrics = stats.metrics;
    const failures = metrics.failures;

    return (
        <section
            aria-label="Tempo e falhas"
            className="grid gap-5 rounded-2xl border bg-popover p-4 sm:p-5 @lg:grid-cols-2"
        >
            <CompactMetric
                definition={findMetricDefinition("averageProcessingSeconds")}
                metric={metrics.averageProcessingSeconds}
            />
            <div className="flex items-start gap-3">
                <StageCrewMascot status="failed" className="size-9" />
                <div className="grid gap-2">
                    <CompactMetric
                        definition={findMetricDefinition("failures")}
                        metric={failures}
                    />
                    {(failures.current ?? 0) > 0 && <FailedVideosLink />}
                </div>
            </div>
        </section>
    );
}

/**
 * Direction "Equipe" (DESIGN.md): each crew member shows what they did in the period, in the
 * order the work flows, then time and failures, the best clips and the trend. Columns follow the
 * board's own width (container queries), so the open sidebar does not squeeze them.
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
                <ol className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-4">
                    {CREW_STAGES.map((stage) => (
                        <CrewStageCard key={stage.status} stage={stage} stats={stats} />
                    ))}
                </ol>
            </section>
            <TimeAndFailures stats={stats} />
            <BestClipsCarousel clips={stats.bestClips} onWiden={onWiden} />
            <CumulativeClipsChart stats={stats} />
        </div>
    );
}
