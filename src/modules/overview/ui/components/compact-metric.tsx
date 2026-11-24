import type { ReactNode } from "react";
import { EMPTY_VALUE } from "#/modules/overview/model/format-metric";
import { describeChange } from "#/modules/overview/model/metric-change";
import type { MetricView } from "#/modules/overview/model/overview-views";
import { MetricChangeBadge } from "#/modules/overview/ui/components/metric-change-badge";
import type { MetricDefinition } from "#/modules/overview/model/metric-definitions";
import { MetricHelp } from "#/modules/overview/ui/components/metric-help";

interface CompactMetricProps {
    definition: MetricDefinition;
    metric: MetricView;
}

function CompactValue({ definition, metric }: CompactMetricProps): ReactNode {
    const value = metric.current;

    // "Sem dados" alone reads like a fault; the note says why there is nothing to show.
    if (value === null) {
        return (
            <p className="grid gap-0.5">
                <strong className="text-lg font-semibold">{EMPTY_VALUE}</strong>
                <span className="text-xs text-muted-foreground">{definition.emptyNote}</span>
            </p>
        );
    }

    return (
        <p className="flex items-baseline gap-1">
            <strong className="text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums">
                {definition.format(value)}
            </strong>
            {definition.unit !== null && (
                <span className="text-sm font-semibold text-muted-foreground">
                    {definition.unit}
                </span>
            )}
        </p>
    );
}

/** One number, its name and how it moved, without the sparkline: for boards where it is secondary. */
export function CompactMetric({ definition, metric }: CompactMetricProps): ReactNode {
    const change = describeChange(metric, {
        betterWhen: definition.betterWhen,
        isAbsolute: definition.isAbsolute,
    });

    return (
        <div className="grid content-start gap-1">
            <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                {definition.label}
                <MetricHelp label={definition.label} help={definition.help} />
            </p>
            <CompactValue definition={definition} metric={metric} />
            {change !== null && change.direction !== "none" && (
                <p className="text-xs text-muted-foreground">
                    <MetricChangeBadge change={change} /> vs. período anterior
                </p>
            )}
        </div>
    );
}
