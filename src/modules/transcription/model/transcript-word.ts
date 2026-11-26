import { z } from "zod";

/** Longer words are cut when the transcript is saved and refused when a caption is edited. */
export const MAX_CAPTION_WORD_LENGTH = 60;
const MILLISECONDS_PER_SECOND = 1000;
const transcriptTimeSchema = z
    .number()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER / MILLISECONDS_PER_SECOND);

export const transcriptWordsSchema = z.array(
    z.object({
        text: z.string(),
        startSeconds: transcriptTimeSchema,
        endSeconds: transcriptTimeSchema,
    }),
);

export type TranscriptWord = z.infer<typeof transcriptWordsSchema>[number];
