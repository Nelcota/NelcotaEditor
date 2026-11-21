import type {
    OverviewFunnel,
    OverviewMetrics,
    OverviewStats,
} from "#/modules/overview/overview-views";
import {
    bucketByDay,
    createPeriodWindow,
    findDayIndex,
    listCurrentDays,
} from "#/modules/overview/period-buckets";
import type { PeriodWindow } from "#/modules/overview/period-buckets";
import { accumulate, summarizeMetric } from "#/modules/overview/summarize-metric";
import {
    countVideos,
    listClipStatuses,
    listFinishedVideos,
    listReadyClips,
} from "#/modules/overview/server/overview-rows.server";
import type {
    OverviewClipRow,
    OverviewVideoRow,
} from "#/modules/overview/server/overview-rows.server";
import { toClipView } from "#/modules/videos/server/video-queries.server";
import type { LibraryClip } from "#/modules/videos/video-views";

const BEST_CLIP_COUNT = 10;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

function isInCurrentPeriod(window: PeriodWindow, date: Date): boolean {
    const index = findDayIndex(window, date);

    return index !== null && index >= window.periodDays;
}

/** A video counted on the day it was sent. */
function created(row: OverviewVideoRow, value: number): { date: Date; value: number } {
    return { date: row.createdAt, value };
}

function summarizeVideoMetrics(window: PeriodWindow, rows: Array<OverviewVideoRow>) {
    return {
        videosSent: summarizeMetric(
            bucketByDay(window, rows, (row) => created(row, 1)),
            "sum",
        ),
        failures: summarizeMetric(
            bucketByDay(window, rows, (row) => {
                if (row.status !== "failed") {
                    return null;
                }

                return created(row, 1);
            }),
            "sum",
        ),
        transcribedMinutes: summarizeMetric(
            bucketByDay(window, rows, (row) => {
                if (row.hasTranscript === false || row.durationSeconds === null) {
                    return null;
                }

                return created(row, row.durationSeconds / SECONDS_PER_MINUTE);
            }),
            "sum",
        ),
        averageProcessingSeconds: summarizeMetric(
            bucketByDay(window, rows, (row) => {
                const finishedAt = row.finishedAt;
                const processingStartedAt = row.processingStartedAt;

                // Measured from the run's start, not createdAt: a re-render weeks later would
                // count weeks. Videos from before the start was recorded stay out of the average.
                if (row.status !== "done" || finishedAt === null || processingStartedAt === null) {
                    return null;
                }

                const elapsed = finishedAt.getTime() - processingStartedAt.getTime();

                return { date: finishedAt, value: elapsed / MILLISECONDS_PER_SECOND };
            }),
            "average",
        ),
    };
}

function summarizeClipMetrics(window: PeriodWindow, rows: Array<OverviewClipRow>) {
    return {
        clipsReady: summarizeMetric(
            bucketByDay(window, rows, (row) => ({ date: row.clip.createdAt, value: 1 })),
            "sum",
        ),
        averageScore: summarizeMetric(
            bucketByDay(window, rows, (row) => ({
                date: row.clip.createdAt,
                value: row.clip.score,
            })),
            "average",
        ),
    };
}

async function buildFunnel(
    window: PeriodWindow,
    rows: Array<OverviewVideoRow>,
): Promise<OverviewFunnel> {
    const periodVideos = rows.filter((row) => isInCurrentPeriod(window, row.createdAt));
    const clipStatuses = await listClipStatuses(periodVideos.map((row) => row.id));
    const selectedIds = new Set(clipStatuses.map((clip) => clip.videoId));
    const readyIds = new Set(
        clipStatuses.filter((clip) => clip.status === "done").map((clip) => clip.videoId),
    );

    return {
        sent: periodVideos.length,
        transcribed: periodVideos.filter((row) => row.hasTranscript === true).length,
        selected: periodVideos.filter((row) => selectedIds.has(row.id) === true).length,
        ready: periodVideos.filter((row) => readyIds.has(row.id) === true).length,
    };
}

function pickBestClips(window: PeriodWindow, rows: Array<OverviewClipRow>): Array<LibraryClip> {
    return rows
        .filter((row) => isInCurrentPeriod(window, row.clip.createdAt))
        .toSorted((first, second) => second.clip.score - first.clip.score)
        .slice(0, BEST_CLIP_COUNT)
        .map((row) => ({
            clip: toClipView(row.clip),
            videoId: row.videoId,
            videoTitle: row.videoTitle,
            createdAt: row.clip.createdAt.toISOString(),
        }));
}

function accumulateClips(metrics: OverviewMetrics, previousDaily: Array<number>) {
    const currentDaily = metrics.clipsReady.daily.map((count) => count ?? 0);

    return { current: accumulate(currentDaily), previous: accumulate(previousDaily) };
}

export async function summarizeOverview(
    userId: string,
    periodDays: number,
): Promise<OverviewStats> {
    const window = createPeriodWindow(periodDays, new Date());
    const [videoRows, clipRows, videoCounts] = await Promise.all([
        listFinishedVideos(userId, window.previousStart),
        listReadyClips(userId, window.previousStart),
        countVideos(userId),
    ]);
    const metrics: OverviewMetrics = {
        ...summarizeVideoMetrics(window, videoRows),
        ...summarizeClipMetrics(window, clipRows),
    };
    const previousClipDaily = bucketByDay(window, clipRows, (row) => ({
        date: row.clip.createdAt,
        value: 1,
    }))
        .slice(0, periodDays)
        .map((day) => day.length);

    return {
        periodDays,
        days: listCurrentDays(window),
        hasAnyVideo: videoCounts.total > 0,
        inProgressCount: videoCounts.inProgress,
        metrics,
        cumulativeClips: accumulateClips(metrics, previousClipDaily),
        funnel: await buildFunnel(window, videoRows),
        bestClips: pickBestClips(window, clipRows),
    };
}
