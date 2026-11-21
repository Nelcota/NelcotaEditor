import type { OverviewStats } from "#/modules/overview/overview-views";
import { BestClipsCarousel } from "#/modules/overview/ui/best-clips-carousel";
import { CumulativeClipsChart } from "#/modules/overview/ui/cumulative-clips-chart";
import { InProgressNotice } from "#/modules/overview/ui/in-progress-notice";
import { MetricCard } from "#/modules/overview/ui/metric-card";
import { METRIC_DEFINITIONS } from "#/modules/overview/ui/metric-definitions";
import { PipelineFunnel } from "#/modules/overview/ui/pipeline-funnel";
import { cn } from "#/shared/ui/cn";

interface OverviewBoardProps {
    stats: OverviewStats;
    /** True while the numbers of the previous period are shown and the new ones load. */
    isStale: boolean;
    onWiden: (() => void) | null;
}

/**
 * Direction A "Números em faixa" (DESIGN.md): the six numbers in a band, then the trend beside the
 * funnel, then the best clips across the full width. Columns follow the board's own width
 * (container queries), so the open sidebar no longer squeezes them.
 */
export function OverviewBoard({ stats, isStale, onWiden }: OverviewBoardProps) {
    const metrics = stats.metrics;

    return (
        <div
            className={cn(
                "@container grid gap-4 transition-opacity",
                isStale === true && "opacity-55",
            )}
            aria-busy={isStale}
        >
            <InProgressNotice count={stats.inProgressCount} />
            {stats.metrics.videosSent.previous === 0 && (
                <p className="text-sm text-muted-foreground">
                    Nada no período anterior para comparar: as variações aparecem a partir do
                    próximo período.
                </p>
            )}
            <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
                {METRIC_DEFINITIONS.map((definition) => (
                    <MetricCard
                        key={definition.key}
                        definition={definition}
                        metric={metrics[definition.key]}
                    />
                ))}
            </div>
            <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <CumulativeClipsChart stats={stats} />
                <PipelineFunnel funnel={stats.funnel} />
            </div>
            <BestClipsCarousel clips={stats.bestClips} onWiden={onWiden} />
        </div>
    );
}
