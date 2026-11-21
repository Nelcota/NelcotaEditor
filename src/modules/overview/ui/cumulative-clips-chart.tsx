import TrendingUpIcon from "~icons/lucide/trending-up";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatDayLabel, formatInteger } from "#/modules/overview/format-metric";
import type { OverviewStats } from "#/modules/overview/overview-views";
import type { CumulativePoint } from "#/modules/overview/ui/cumulative-point";
import { CumulativeTooltip } from "#/modules/overview/ui/cumulative-tooltip";

const CHART_HEIGHT = 260;
const AXIS_TICK = {
    fill: "var(--muted-foreground)",
    // The project floor: no text below 13px (DESIGN.md › Type and icons).
    fontSize: 13,
    style: { fontVariantNumeric: "tabular-nums" },
};
const GRADIENT_ID = "cumulative-clips-fill";

function toPoints(stats: OverviewStats): Array<CumulativePoint> {
    const cumulative = stats.cumulativeClips;

    return stats.days.map((day, index) => ({
        day,
        current: cumulative.current[index] ?? 0,
        previous: cumulative.previous[index] ?? 0,
    }));
}

function ChartLegend() {
    return (
        <div className="flex gap-4 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-chart-current" />
                Este período
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-chart-previous" />
                Período anterior
            </span>
        </div>
    );
}

export function CumulativeClipsChart({ stats }: { stats: OverviewStats }) {
    const points = toPoints(stats);
    const total = stats.metrics.clipsReady.current ?? 0;
    const previousTotal = stats.metrics.clipsReady.previous ?? 0;

    return (
        <section className="grid min-w-0 content-start gap-2 rounded-2xl border bg-popover p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-lg leading-tight font-semibold">
                <TrendingUpIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                Cortes acumulados
            </h2>
            <p className="flex flex-wrap items-baseline gap-x-2.5">
                <strong className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatInteger(total)}
                </strong>
                <span className="text-sm text-muted-foreground">
                    cortes · eram {formatInteger(previousTotal)} no período anterior
                </span>
            </p>
            <ChartLegend />
            <div className="mt-2" aria-hidden="true">
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                    <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <defs>
                            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--chart-current)"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--chart-current)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="day"
                            tickFormatter={formatDayLabel}
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={CumulativeTooltip} cursor={{ stroke: "var(--input)" }} />
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="var(--chart-previous)"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="current"
                            stroke="var(--chart-current)"
                            strokeWidth={2.2}
                            fill={`url(#${GRADIENT_ID})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
