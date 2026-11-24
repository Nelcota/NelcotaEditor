import type { StudioDraft } from "#/modules/clips/model/clip-studio";

const WINDOW_PADDING_SECONDS = 20;
const PERCENT = 100;
const SHORT_WINDOW_SECONDS = 80;
const SHORT_TICK_SECONDS = 5;
const LONG_TICK_SECONDS = 10;

export interface TimelineWindow {
    fromSeconds: number;
    toSeconds: number;
}

/** The stretch of the original shown: the clip, before and after edits, with room to grow. */
export function computeTimelineWindow(
    draft: StudioDraft,
    applied: StudioDraft,
    videoDurationSeconds: number | null,
): TimelineWindow {
    const lastSecond = videoDurationSeconds ?? Math.max(draft.endSeconds, applied.endSeconds);
    const fromSeconds = Math.max(
        0,
        Math.min(draft.startSeconds, applied.startSeconds) - WINDOW_PADDING_SECONDS,
    );
    const toSeconds = Math.min(
        lastSecond,
        Math.max(draft.endSeconds, applied.endSeconds) + WINDOW_PADDING_SECONDS,
    );

    return { fromSeconds, toSeconds: Math.max(toSeconds, fromSeconds + 1) };
}

export function toPercent(window: TimelineWindow, seconds: number): number {
    const span = window.toSeconds - window.fromSeconds;

    return ((seconds - window.fromSeconds) / span) * PERCENT;
}

/** The part of the lane's box the time depends on. */
export interface LaneBox {
    left: number;
    width: number;
}

/** The time under the pointer, from where it is inside the lane. */
export function secondsAtPointer(
    window: TimelineWindow,
    lane: HTMLElement,
    clientX: number,
): number {
    return secondsInLane(window, lane.getBoundingClientRect(), clientX);
}

/** Same, from a box measured once: a drag reads it on every move without forcing a layout. */
export function secondsInLane(window: TimelineWindow, rect: LaneBox, clientX: number): number {
    if (rect.width === 0) {
        return window.fromSeconds;
    }

    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

    return window.fromSeconds + ratio * (window.toSeconds - window.fromSeconds);
}

export function tickSeconds(window: TimelineWindow): Array<number> {
    let step = LONG_TICK_SECONDS;

    if (window.toSeconds - window.fromSeconds <= SHORT_WINDOW_SECONDS) {
        step = SHORT_TICK_SECONDS;
    }

    const ticks: Array<number> = [];

    for (
        let tick = Math.ceil(window.fromSeconds / step) * step;
        tick <= window.toSeconds;
        tick += step
    ) {
        ticks.push(tick);
    }

    return ticks;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
