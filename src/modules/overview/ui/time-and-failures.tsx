import ArrowRightIcon from "~icons/lucide/arrow-right";
import CircleCheckIcon from "~icons/lucide/circle-check";
import TimerIcon from "~icons/lucide/timer";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EMPTY_VALUE } from "#/modules/overview/format-metric";
import { describeChange } from "#/modules/overview/metric-change";
import type { MetricView, OverviewStats } from "#/modules/overview/overview-views";
import { MetricChangeBadge } from "#/modules/overview/ui/metric-change-badge";
import { findMetricDefinition } from "#/modules/overview/ui/metric-definitions";
import type { MetricDefinition } from "#/modules/overview/ui/metric-definitions";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

const ICON_TILE_CLASS = "grid size-11 shrink-0 place-items-center rounded-xl [&>svg]:size-5";

interface MetricTileProps {
    definition: MetricDefinition;
    metric: MetricView;
    icon: ReactNode;
    action?: ReactNode;
    isAlert?: boolean;
}

/** How the number moved, or why there is nothing to compare: the line at the foot of a tile. */
function TileFootnote({ definition, metric }: Pick<MetricTileProps, "definition" | "metric">) {
    const change = describeChange(metric, {
        betterWhen: definition.betterWhen,
        isAbsolute: definition.isAbsolute,
    });

    if (metric.current === null) {
        return <span>{definition.emptyNote}</span>;
    }

    if (change === null) {
        return <span>Sem período anterior para comparar</span>;
    }

    if (change.direction === "none") {
        return <span>Igual ao período anterior</span>;
    }

    return (
        <span className="inline-flex items-center gap-1">
            <MetricChangeBadge change={change} /> vs. período anterior
        </span>
    );
}

function TileValue({ definition, metric }: Pick<MetricTileProps, "definition" | "metric">) {
    const value = metric.current;

    // An empty value reads quieter than a number, so it never looks like a fault.
    if (value === null) {
        return <p className="text-2xl font-semibold text-muted-foreground">{EMPTY_VALUE}</p>;
    }

    return (
        <p className="text-3xl font-bold tracking-[-0.03em] whitespace-nowrap tabular-nums">
            {definition.format(value)}
        </p>
    );
}

/**
 * A secondary number with the crew cards' anatomy: icon and name on top, the value, then a ruled
 * foot with how it moved and, when there is one, what to do about it.
 */
function MetricTile(props: MetricTileProps): ReactNode {
    const { definition, metric, icon, action, isAlert } = props;

    return (
        <li
            className={cn(
                "grid content-start gap-4 rounded-2xl border bg-popover p-4 @lg:p-5",
                isAlert === true && "border-destructive/35",
            )}
        >
            <div className="flex items-center gap-3">
                {icon}
                <p className="min-w-0 leading-tight">
                    <strong className="block font-semibold">{definition.label}</strong>
                    <span className="text-sm text-muted-foreground">{definition.help}</span>
                </p>
            </div>
            <TileValue definition={definition} metric={metric} />
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                <TileFootnote definition={definition} metric={metric} />
                {action}
            </div>
        </li>
    );
}

function FailedVideosLink(): ReactNode {
    return (
        <Button asChild variant="secondary" size="sm">
            <Link to="/videos" search={{ status: "failed" }}>
                Ver vídeos com falha
                <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
        </Button>
    );
}

function FailuresTile({ metric }: { metric: MetricView }): ReactNode {
    const definition = findMetricDefinition("failures");
    const failureCount = metric.current ?? 0;

    if (failureCount === 0) {
        const icon = (
            <span className={cn(ICON_TILE_CLASS, "bg-success/12 text-success")}>
                <CircleCheckIcon aria-hidden="true" />
            </span>
        );

        return <MetricTile definition={definition} metric={metric} icon={icon} />;
    }

    return (
        <MetricTile
            definition={definition}
            metric={metric}
            icon={<StageCrewMascot status="failed" className="size-11" />}
            action={<FailedVideosLink />}
            isAlert={true}
        />
    );
}

/** How long a video takes and how many did not make it, side by side from medium widths up. */
export function TimeAndFailures({ stats }: { stats: OverviewStats }): ReactNode {
    const metrics = stats.metrics;
    const timeIcon = (
        <span className={cn(ICON_TILE_CLASS, "bg-primary/12 text-primary-ink")}>
            <TimerIcon aria-hidden="true" />
        </span>
    );

    return (
        <section aria-label="Tempo e falhas">
            <ul className="grid gap-3 @lg:grid-cols-2">
                <MetricTile
                    definition={findMetricDefinition("averageProcessingSeconds")}
                    metric={metrics.averageProcessingSeconds}
                    icon={timeIcon}
                />
                <FailuresTile metric={metrics.failures} />
            </ul>
        </section>
    );
}
