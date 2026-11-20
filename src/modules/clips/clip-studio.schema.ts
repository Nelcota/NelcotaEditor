import { z } from "zod";
import {
    CAPTION_COLORS,
    CAPTION_FONTS,
    CAPTION_POSITIONS,
    CAPTION_SIZES,
    DEFAULT_CAPTION_FONT,
} from "#/modules/clips/caption-style";
import { ASPECT_RATIOS, CAPTION_STYLES } from "#/modules/clips/clip-format";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/highlights/highlight-limits";

export const MAX_CAPTION_WORD_LENGTH = 60;
export const MAX_CAPTION_WORDS_PER_CUE = 30;
// A 90-second clip spoken fast has about 300 words; one word per cue is the worst case.
export const MAX_CAPTION_CUES = 400;
/** Whisper rounds to hundredths; edges this close count as touching, not overlapping. */
export const TIME_TOLERANCE_SECONDS = 0.05;

const secondsSchema = z.number().min(0).max(Number.MAX_SAFE_INTEGER);

export const captionWordSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Uma palavra não pode ficar vazia.")
        .max(MAX_CAPTION_WORD_LENGTH, "Uma palavra está longa demais."),
    startSeconds: secondsSchema,
    endSeconds: secondsSchema,
});

export const captionCueSchema = z.object({
    startSeconds: secondsSchema,
    endSeconds: secondsSchema,
    words: z.array(captionWordSchema).min(1).max(MAX_CAPTION_WORDS_PER_CUE),
});

export type CaptionWord = z.infer<typeof captionWordSchema>;
export type CaptionCue = z.infer<typeof captionCueSchema>;

const draftFieldsSchema = z.object({
    startSeconds: secondsSchema,
    endSeconds: secondsSchema,
    aspectRatio: z.enum(ASPECT_RATIOS),
    captionStyle: z.enum(CAPTION_STYLES),
    captionColor: z.enum(CAPTION_COLORS),
    captionSize: z.enum(CAPTION_SIZES),
    captionPosition: z.enum(CAPTION_POSITIONS),
    // Drafts saved before fonts existed have none; they get the font every clip had then.
    captionFont: z.enum(CAPTION_FONTS).default(DEFAULT_CAPTION_FONT),
    cues: z.array(captionCueSchema).max(MAX_CAPTION_CUES),
});

type DraftFields = z.infer<typeof draftFieldsSchema>;

function hasAllowedDuration(draft: DraftFields): boolean {
    const durationSeconds = draft.endSeconds - draft.startSeconds;

    return durationSeconds >= MIN_CLIP_SECONDS && durationSeconds <= MAX_CLIP_SECONDS;
}

interface TimeRange {
    startSeconds: number;
    endSeconds: number;
}

function isRangeInside(inner: TimeRange, outer: TimeRange): boolean {
    if (inner.endSeconds < inner.startSeconds) {
        return false;
    }

    if (inner.startSeconds < outer.startSeconds - TIME_TOLERANCE_SECONDS) {
        return false;
    }

    return inner.endSeconds <= outer.endSeconds + TIME_TOLERANCE_SECONDS;
}

function areWordsInsideCue(cue: CaptionCue): boolean {
    return cue.words.every((word) => isRangeInside(word, cue));
}

/** Cues come in time order, inside the clip, never on top of each other. */
function hasOrderedCues(draft: DraftFields): boolean {
    const cues = draft.cues;

    return cues.every((cue, index) => {
        const previousCue = cues[index - 1];

        if (isRangeInside(cue, draft) === false) {
            return false;
        }

        if (areWordsInsideCue(cue) === false) {
            return false;
        }

        if (previousCue === undefined) {
            return true;
        }

        return cue.startSeconds >= previousCue.endSeconds - TIME_TOLERANCE_SECONDS;
    });
}

/** Everything the Studio edits about one clip. Times are seconds of the original video. */
export const studioDraftSchema = draftFieldsSchema
    .refine(hasAllowedDuration, {
        message: `O corte deve durar entre ${MIN_CLIP_SECONDS} e ${MAX_CLIP_SECONDS} segundos.`,
        path: ["endSeconds"],
    })
    .refine(hasOrderedCues, {
        message: "As legendas precisam estar dentro do corte, em ordem e sem se sobrepor.",
        path: ["cues"],
    });

export type StudioDraft = z.infer<typeof studioDraftSchema>;

const clipReferenceSchema = z.object({ videoId: z.uuid(), clipId: z.uuid() });

export const clipStudioInputSchema = clipReferenceSchema;

export const saveClipDraftInputSchema = clipReferenceSchema.extend({
    expectedVersion: z.number().int().min(0),
    draft: studioDraftSchema,
});

export const renderClipDraftInputSchema = clipReferenceSchema.extend({
    expectedVersion: z.number().int().min(0),
});
