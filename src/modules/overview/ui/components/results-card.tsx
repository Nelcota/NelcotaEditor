import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceDot,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { formatDayLabel, formatInteger } from "#/modules/overview/model/format-metric";
import type { OverviewStats } from "#/modules/overview/model/overview-views";
import { toVideoMascotIndex } from "#/modules/videos/model/video-mascot";
import { Mascot } from "#/shared/ui/mascot";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { pluralize } from "#/shared/ui/pluralize";

const RANKED_CLIP_COUNT = 6;
const CHART_HEIGHT = 190;
const MAX_SCORE = 100;
const AXIS_TICK = {
    fill: "var(--muted-foreground)",
    fontSize: 13,
    style: { fontVariantNumeric: "tabular-nums" },
};

interface DailyPoint {
    day: string;
    clips: number;
}

interface Peak {
    day: string;
    clips: number;
}

function toDailyPoints(stats: OverviewStats): Array<DailyPoint> {
    const daily = stats.metrics.clipsReady.daily;

    return stats.days.map((day, index) => ({ day, clips: daily[index] ?? 0 }));
}

/** The busiest day; null when no clip came out in the period. */
function findPeak(points: Array<DailyPoint>): Peak | null {
    let peak: Peak | null = null;

    for (const point of points) {
        if (point.clips > 0 && (peak === null || point.clips > peak.clips)) {
            peak = point;
        }
    }

    return peak;
}

function rankClips(clips: Array<LibraryClip>): Array<LibraryClip> {
    return clips
        .toSorted((first, second) => second.clip.score - first.clip.score)
        .slice(0, RANKED_CLIP_COUNT);
}

interface StatProps {
    value: string;
    label: string;
}

function Stat({ value, label }: StatProps): ReactNode {
    return (
        <div className="flex min-w-20 flex-col-reverse justify-center px-4 py-2 text-center">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg leading-tight font-bold tracking-[-0.02em] tabular-nums">
                {value}
            </dd>
        </div>
    );
}

function StatGroup({ stats }: { stats: OverviewStats }): ReactNode {
    const metrics = stats.metrics;
    const averageScore = metrics.averageScore.current;
    let scoreValue = "sem nota";

    if (averageScore !== null) {
        scoreValue = formatInteger(averageScore);
    }

    return (
        <dl className="flex w-fit divide-x divide-border rounded-xl bg-card">
            <Stat value={formatInteger(metrics.clipsReady.current ?? 0)} label="cortes" />
            <Stat value={scoreValue} label="nota média" />
            <Stat value={formatInteger(metrics.videosSent.current ?? 0)} label="vídeos" />
        </dl>
    );
}

/** The best clips, ranked by Brilho's score, each with its bar (the reference's creators list). */
function ClipRanking({ clips }: { clips: Array<LibraryClip> }): ReactNode {
    if (clips.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum corte pronto no período. Os melhores aparecem aqui.
            </p>
        );
    }

    return (
        <ol className="grid content-start gap-3.5">
            {rankClips(clips).map((libraryClip) => {
                const clip = libraryClip.clip;
                const score = Math.min(MAX_SCORE, Math.max(0, clip.score));

                return (
                    <li
                        key={clip.id}
                        className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(3rem,7rem)_2.5rem] items-center gap-3 text-sm"
                    >
                        <span className="grid size-7 place-items-center rounded-full bg-secondary">
                            <Mascot
                                index={toVideoMascotIndex(libraryClip.videoId)}
                                className="size-5"
                            />
                        </span>
                        <span className="truncate font-medium" title={clip.title}>
                            {clip.title}
                        </span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                            <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${score}%` }}
                            />
                        </span>
                        <span className="text-end font-semibold tabular-nums">{score}</span>
                    </li>
                );
            })}
        </ol>
    );
}

type PeakLabelPosition = "top" | "left" | "right";

/** Share of the axis near each edge where a label above the dot would be cut by the chart's side. */
const EDGE_SHARE = 0.2;

/** Near either side the peak's label leans inward, so a peak on the first or last day stays readable. */
function toPeakLabelPosition(points: Array<DailyPoint>, peak: Peak): PeakLabelPosition {
    const lastIndex = points.length - 1;
    const peakIndex = points.findIndex((point) => point.day === peak.day);

    if (lastIndex <= 0 || peakIndex < 0) {
        return "top";
    }

    const position = peakIndex / lastIndex;

    if (position >= 1 - EDGE_SHARE) {
        return "left";
    }

    if (position <= EDGE_SHARE) {
        return "right";
    }

    return "top";
}

function DailyClipsChart({
    points,
    peak,
}: {
    points: Array<DailyPoint>;
    peak: Peak | null;
}): ReactNode {
    return (
        <div className="grid gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden="true" className="size-2 rounded-full bg-chart-current" />
                Cortes por dia
            </p>
            <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                    <AreaChart data={points} margin={{ top: 22, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="day"
                            tickFormatter={formatDayLabel}
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={32}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="clips"
                            stroke="var(--chart-current)"
                            strokeWidth={2}
                            fill="var(--chart-current)"
                            fillOpacity={0.08}
                            isAnimationActive={false}
                        />
                        {peak !== null && (
                            <ReferenceDot
                                x={peak.day}
                                y={peak.clips}
                                r={4}
                                fill="var(--chart-current)"
                                stroke="var(--card)"
                                label={{
                                    value: `${peak.clips} ${pluralize(peak.clips, "corte", "cortes")}`,
                                    position: toPeakLabelPosition(points, peak),
                                    fill: "var(--foreground)",
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/** One sentence on what the card shows, like the reference's answer under the chart. */
function describeResults(clips: Array<LibraryClip>, peak: Peak | null): string {
    const best = rankClips(clips)[0];
    const parts: Array<string> = [];

    if (best !== undefined) {
        parts.push(`"${best.clip.title}" tem a maior nota, ${best.clip.score}.`);
    }

    if (peak !== null) {
        parts.push(
            `O pico foi em ${formatDayLabel(peak.day)}, com ${peak.clips} ${pluralize(peak.clips, "corte", "cortes")} em um dia.`,
        );
    }

    return parts.join(" ");
}

/** The period's results in one card: totals, the ranking and the clips per day. */
export function ResultsCard({ stats }: { stats: OverviewStats }): ReactNode {
    const days = stats.days;
    const firstDay = days[0];
    const lastDay = days.at(-1);
    const points = toDailyPoints(stats);
    const peak = findPeak(points);
    const summary = describeResults(stats.bestClips, peak);
    let range = "";

    if (firstDay !== undefined && lastDay !== undefined) {
        range = `${formatDayLabel(firstDay)} a ${formatDayLabel(lastDay)} · todos os vídeos`;
    }

    return (
        <div className="grid gap-4">
            <section
                aria-labelledby="results-title"
                className="grid gap-4 rounded-2xl border p-4 sm:p-5"
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2
                            id="results-title"
                            className="text-lg leading-tight font-semibold tracking-[-0.02em]"
                        >
                            Cortes do período
                        </h2>
                        <p className="text-xs text-muted-foreground">{range}</p>
                    </div>
                    <StatGroup stats={stats} />
                </div>
                <div className="grid gap-3 @3xl:grid-cols-2">
                    <div className="rounded-xl bg-card p-4">
                        <h3 className="sr-only">Melhores cortes por nota</h3>
                        <ClipRanking clips={stats.bestClips} />
                    </div>
                    <div className="min-w-0 rounded-xl bg-card p-4">
                        <h3 className="sr-only">Cortes por dia</h3>
                        <DailyClipsChart points={points} peak={peak} />
                    </div>
                </div>
            </section>
            {summary.length > 0 && <p className="text-sm">{summary}</p>}
        </div>
    );
}
