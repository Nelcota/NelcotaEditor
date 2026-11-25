import { z } from "zod";
import {
    CAPTION_COLORS,
    CAPTION_FONTS,
    CAPTION_POSITIONS,
    CAPTION_SIZES,
    DEFAULT_CAPTION_FONT,
} from "#/modules/clips/model/caption-style";
import { ASPECT_RATIOS, CAPTION_STYLES } from "#/modules/clips/model/clip-format";
import {
    clipDurationCentiseconds,
    MAX_CLIP_CENTISECONDS,
    MAX_CLIP_SECONDS,
    MIN_CLIP_CENTISECONDS,
    MIN_CLIP_SECONDS,
} from "#/modules/clips/model/clip-limits";
import { MAX_CAPTION_WORD_LENGTH } from "#/modules/transcription/model/transcript-word";

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

export type CaptionWord = z.infer<typeof captionWordSchema>;

/**
 * Each word ends after it starts and starts after the one before it ends. A word out of order
 * became a subtitle event that ends where it starts: a caption that never shows.
 */
function hasOrderedWords(words: Array<CaptionWord>): boolean {
    return words.every((word, index) => {
        const previousWord = words[index - 1];

        if (word.endSeconds < word.startSeconds) {
            return false;
        }

        if (previousWord === undefined) {
            return true;
        }

        if (word.startSeconds < previousWord.startSeconds) {
            return false;
        }

        return word.startSeconds >= previousWord.endSeconds - TIME_TOLERANCE_SECONDS;
    });
}

export const captionCueSchema = z.object({
    startSeconds: secondsSchema,
    endSeconds: secondsSchema,
    words: z
        .array(captionWordSchema)
        .min(1, "Uma legenda precisa ter pelo menos uma palavra.")
        .max(
            MAX_CAPTION_WORDS_PER_CUE,
            `Uma legenda pode ter até ${MAX_CAPTION_WORDS_PER_CUE} palavras. Divida em duas.`,
        )
        .refine(
            hasOrderedWords,
            "As palavras de uma legenda precisam estar em ordem, sem se sobrepor.",
        ),
});

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
    cues: z
        .array(captionCueSchema)
        .max(MAX_CAPTION_CUES, `O corte pode ter até ${MAX_CAPTION_CUES} legendas.`),
});

type DraftFields = z.infer<typeof draftFieldsSchema>;

/**
 * Compared in whole hundredths: edges are rounded to hundredths, and float subtraction turns a
 * trim exactly at the limit into 14.999999999999998 or 90.00000000000001.
 */
function hasAllowedDuration(draft: DraftFields): boolean {
    const durationCentiseconds = clipDurationCentiseconds(draft.startSeconds, draft.endSeconds);

    return (
        durationCentiseconds >= MIN_CLIP_CENTISECONDS &&
        durationCentiseconds <= MAX_CLIP_CENTISECONDS
    );
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
