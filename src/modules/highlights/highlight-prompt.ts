import { MAX_CLIP_SECONDS } from "#/modules/clips/clip-limits";
import { CLIP_LENGTH_TARGETS } from "#/modules/clips/clip-length-targets";
import type { ClipLengthTarget } from "#/modules/clips/clip-length-targets";
import type { ClipLength } from "#/modules/video-records/clip-length";

/** Ask for a few extra candidates: some get dropped when they overlap or are too short. */
const EXTRA_CANDIDATES = 3;

// Free clips may run long to keep the payoff; fixed lengths ask the model to find a moment that
// fits instead, because the clip is trimmed afterwards.
const LENGTH_RULES: Record<ClipLength, (target: ClipLengthTarget) => string> = {
    short: (target) =>
        `- Between ${target.minSeconds} and ${target.maxSeconds} seconds long, never more than ${target.maxSeconds}. Pick moments whose hook, body and payoff all fit in that time, ending at the end of a sentence.`,
    minute: (target) =>
        `- Between ${target.minSeconds} and ${target.maxSeconds} seconds long, aiming close to ${target.aimSeconds} seconds, never more than ${target.maxSeconds}. End at the end of a sentence; pick moments whose payoff lands near that length.`,
    free: (target) =>
        `- Between ${target.minSeconds} and ${target.maxSeconds} seconds long, never more than ${MAX_CLIP_SECONDS}. Going a bit longer to include the payoff is better than cutting it.`,
};

export function buildHighlightSystemPrompt(clipCount: number, clipLength: ClipLength): string {
    if (Number.isInteger(clipCount) === false || clipCount < 1) {
        throw new RangeError(`Clip count must be a positive integer, got ${clipCount}`);
    }

    const lengthRule = LENGTH_RULES[clipLength](CLIP_LENGTH_TARGETS[clipLength]);
    const candidateCount = clipCount + EXTRA_CANDIDATES;

    return [
        "You are an expert editor of short vertical videos (TikTok, Instagram Reels, YouTube Shorts).",
        "You receive the timestamped transcript of a long video. Each line is `[start-end] text`, in seconds.",
        `Pick up to ${candidateCount} of the best moments to publish as standalone short clips.`,
        "Return fewer clips when the video does not have that many complete moments: one complete clip is worth more than two cut ones.",
        "Every clip is a complete mini story with three parts:",
        "1. Hook: starts at the beginning of a sentence that grabs attention in the first 3 seconds.",
        "2. Body: the idea, story or advice.",
        "3. Payoff: the resolution, result, lesson or punchline that closes the idea.",
        "Before choosing `end`, read the lines that come right after it. If they give the payoff (what happened next, the result, the lesson, the numbers), extend the clip to include them.",
        "Never end a clip right after a problem, a question or a setup whose answer comes in the next lines.",
        "Rules for every clip:",
        lengthRule,
        "- `start` is the start time of a transcript line and `end` is the end time of a transcript line.",
        "- Makes sense on its own, without the rest of the video.",
        "- Does not overlap any other clip.",
        "Prefer surprising facts, useful advice, strong opinions, emotion, stories and humor.",
        "Write `title` and `reason` in the same language as the transcript.",
        "Never use em dashes or en dashes in `title` or `reason`; use a comma, a colon or a period instead.",
        "Answer only with JSON in this exact format:",
        '{"clips":[{"start":12.3,"end":48.9,"title":"Short catchy title (max 60 characters)","reason":"One sentence on why it works","score":87}]}',
        "`start` and `end` are seconds taken from the transcript; `score` is an integer from 1 to 100.",
    ].join("\n");
}
