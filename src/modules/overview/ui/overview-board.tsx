import type { OverviewStats } from "#/modules/overview/overview-views";
import { BestClipsCarousel } from "#/modules/overview/ui/best-clips-carousel";
import { CumulativeClipsChart } from "#/modules/overview/ui/cumulative-clips-chart";
import { InProgressNotice } from "#/modules/overview/ui/in-progress-notice";
import { MetricCard } from "#/modules/overview/ui/metric-card";
import { METRIC_DEFINITIONS } from "#/modules/overview/ui/metric-definitions";
import { PipelineFunnel } from "#/modules/overview/ui/pipeline-funnel";
import { cn } from "#/shared/ui/cn";

const ROW_CLASS = "grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]";

interface OverviewBoardProps {
    stats: OverviewStats;
    /** True while the numbers of the previous period are shown and the new ones load. */
    isStale: boolean;
    onWiden: (() => void) | null;
}

export function OverviewBoard({ stats, isStale, onWiden }: OverviewBoardProps) {
    const metrics = stats.metrics;

    return (
        <div
            className={cn("grid gap-4 transition-opacity", isStale === true && "opacity-55")}
            aria-busy={isStale}
        >
            <InProgressNotice count={stats.inProgressCount} />
            {stats.metrics.videosSent.previous === 0 && (
                <p className="text-sm text-muted-foreground">
                    Nada no período anterior para comparar: as variações aparecem a partir do
                    próximo período.
                </p>
            )}
            <div className={ROW_CLASS}>
                <div className="grid content-start gap-4 sm:grid-cols-2">
                    {METRIC_DEFINITIONS.map((definition) => (
                        <MetricCard
                            key={definition.key}
                            definition={definition}
                            metric={metrics[definition.key]}
                        />
                    ))}
                </div>
                <BestClipsCarousel clips={stats.bestClips} onWiden={onWiden} />
            </div>
            <div className={ROW_CLASS}>
                <CumulativeClipsChart stats={stats} />
                <PipelineFunnel funnel={stats.funnel} clipCount={metrics.clipsReady.current ?? 0} />
            </div>
        </div>
    );
}
