import type { CaptionCue } from "#/modules/clips/clip-studio.schema";

/**
 * A string equal for equal captions. Built field by field, never with JSON.stringify(cue): the same
 * caption read from jsonb or through Zod lists its keys in a different order.
 */
export function toCueKey(cue: CaptionCue): string {
    const words = cue.words.map((word) => [word.text, word.startSeconds, word.endSeconds]);

    return JSON.stringify([cue.startSeconds, cue.endSeconds, words]);
}
