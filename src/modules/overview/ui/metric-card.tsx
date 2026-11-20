import { Link } from "@tanstack/react-router";
import { EMPTY_VALUE } from "#/modules/overview/format-metric";
import { describeChange } from "#/modules/overview/metric-change";
import type { MetricChange } from "#/modules/overview/metric-change";
import type { MetricView } from "#/modules/overview/overview-views";
import { MetricChangeBadge } from "#/modules/overview/ui/metric-change-badge";
import type { MetricDefinition } from "#/modules/overview/ui/metric-definitions";
import { MetricHelp } from "#/modules/overview/ui/metric-help";
import { Sparkline } from "#/modules/overview/ui/sparkline";

interface MetricCardProps {
    definition: MetricDefinition;
    metric: MetricView;
}

function FailedVideosLink() {
    return (
        <Link
            to="/"
            search={{ status: "failed" }}
            className="rounded font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
            ver vídeos
        </Link>
    );
}

interface MetricFooterProps {
    definition: MetricDefinition;
    change: MetricChange | null;
    hasFailures: boolean;
}

function MetricFooter({ definition, change, hasFailures }: MetricFooterProps) {
    if (change === null) {
        return <span>{definition.emptyNote}</span>;
    }

    // With nothing in the previous period, "novo" on every card says nothing; the page says it once.
    if (change.direction === "none" && change.tone === "neutral" && change.label !== "igual") {
        return <span>{hasFailures === true && <FailedVideosLink />}</span>;
    }

    return (
        <span className="flex flex-wrap items-center gap-x-1.5">
            <MetricChangeBadge change={change} />
            <span>vs. período anterior</span>
            {hasFailures === true && (
                <>
                    <span aria-hidden="true">·</span>
                    <FailedVideosLink />
                </>
            )}
        </span>
    );
}

function MetricValue({
    definition,
    value,
}: {
    definition: MetricDefinition;
    value: number | null;
}) {
    if (value === null) {
        return <strong className="text-3xl font-extrabold tracking-tight">{EMPTY_VALUE}</strong>;
    }

    return (
        <p className="flex items-baseline gap-1.5">
            <strong className="text-3xl font-extrabold tracking-tight whitespace-nowrap tabular-nums">
                {definition.format(value)}
            </strong>
            {definition.unit !== null && (
                <span className="text-base font-bold text-muted-foreground">{definition.unit}</span>
            )}
        </p>
    );
}

export function MetricCard({ definition, metric }: MetricCardProps) {
    const MetricIcon = definition.icon;
    const change = describeChange(metric, {
        betterWhen: definition.betterWhen,
        isAbsolute: definition.isAbsolute,
    });

    return (
        <section className="grid gap-2 rounded-2xl border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <MetricIcon aria-hidden="true" className="size-5 shrink-0" />
                {definition.label}
                <MetricHelp label={definition.label} help={definition.help} />
            </h2>
            <div className="flex items-end justify-between gap-3">
                <div className="grid min-w-0 flex-1 gap-2">
                    <MetricValue definition={definition} value={metric.current} />
                    <p className="text-xs text-muted-foreground">
                        <MetricFooter
                            definition={definition}
                            change={change}
                            hasFailures={definition.key === "failures" && (metric.current ?? 0) > 0}
                        />
                    </p>
                </div>
                <Sparkline values={metric.daily} tone={change?.tone ?? "neutral"} />
            </div>
        </section>
    );
}
