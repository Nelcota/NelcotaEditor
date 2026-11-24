import type { LibraryClip } from "#/modules/videos/model/video-views";

/** One number of the Painel: this period, the one before it, and this period day by day. */
export interface MetricView {
    /** Null when there is nothing to measure (an average of no items). */
    current: number | null;
    previous: number | null;
    daily: Array<number | null>;
}

export interface OverviewMetrics {
    videosSent: MetricView;
    clipsReady: MetricView;
    transcribedMinutes: MetricView;
    averageProcessingSeconds: MetricView;
    averageScore: MetricView;
    failures: MetricView;
}

/** Finished videos of the period, by the furthest step they reached. */
export interface OverviewFunnel {
    sent: number;
    transcribed: number;
    selected: number;
    ready: number;
}

export interface OverviewStats {
    periodDays: number;
    /** ISO date (YYYY-MM-DD, UTC) of each day of the period, oldest first. */
    days: Array<string>;
    hasAnyVideo: boolean;
    inProgressCount: number;
    metrics: OverviewMetrics;
    /** Ready clips added up day by day, for this period and the one before it. */
    cumulativeClips: { current: Array<number>; previous: Array<number> };
    funnel: OverviewFunnel;
    bestClips: Array<LibraryClip>;
}
