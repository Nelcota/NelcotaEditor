export const MIN_CLIP_SECONDS = 15;
export const IDEAL_MIN_CLIP_SECONDS = 20;
export const IDEAL_MAX_CLIP_SECONDS = 60;
export const MAX_CLIP_SECONDS = 90;
const CENTISECONDS_PER_SECOND = 100;

export function clipDurationCentiseconds(startSeconds: number, endSeconds: number): number {
    return Math.round((endSeconds - startSeconds) * CENTISECONDS_PER_SECOND);
}

export const MIN_CLIP_CENTISECONDS = MIN_CLIP_SECONDS * CENTISECONDS_PER_SECOND;
export const MAX_CLIP_CENTISECONDS = MAX_CLIP_SECONDS * CENTISECONDS_PER_SECOND;
// Every clip is scored by the AI on a 1–100 scale (the database checks the same range).
export const MIN_SCORE = 1;
export const MAX_SCORE = 100;
