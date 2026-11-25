import type { VideoPurpose, VideoStatus } from "#/modules/video-records/model/video-status";

export interface StageRange {
    startPercent: number;
    endPercent: number;
}

/**
 * How the overall progress bar is split between the steps. Shared by the worker (to report)
 * and the UI (to estimate the time left in the current step).
 */
export const STAGE_RANGES: Partial<Record<VideoStatus, StageRange>> = {
    downloading: { startPercent: 0, endPercent: 20 },
    transcribing: { startPercent: 20, endPercent: 65 },
    selecting: { startPercent: 65, endPercent: 70 },
    rendering: { startPercent: 70, endPercent: 99 },
};

/**
 * A raw video for a format edit stops after the transcript, so its two steps fill the whole bar
 * instead of parking at 65% and then jumping to done.
 */
export const FORMAT_STAGE_RANGES: Partial<Record<VideoStatus, StageRange>> = {
    downloading: { startPercent: 0, endPercent: 15 },
    transcribing: { startPercent: 15, endPercent: 99 },
};

const RANGES_BY_PURPOSE: Readonly<Record<VideoPurpose, Partial<Record<VideoStatus, StageRange>>>> =
    {
        clips: STAGE_RANGES,
        format: FORMAT_STAGE_RANGES,
    };

const PERCENT = 100;

/** Maps a step's own progress (0–100) to the overall progress bar. */
export function toOverallPercent(
    status: VideoStatus,
    stagePercent: number,
    purpose: VideoPurpose = "clips",
): number {
    const range = RANGES_BY_PURPOSE[purpose][status];

    // NaN would survive Math.min/Math.max and end up saved as the video's progress.
    if (Number.isFinite(stagePercent) === false) {
        throw new RangeError(`Stage percent must be a finite number, got ${stagePercent}`);
    }

    if (range === undefined) {
        return 0;
    }

    const boundedPercent = Math.min(PERCENT, Math.max(0, stagePercent));
    const span = range.endPercent - range.startPercent;

    return range.startPercent + (span * boundedPercent) / PERCENT;
}
