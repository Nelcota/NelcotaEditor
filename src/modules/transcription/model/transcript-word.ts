import { z } from "zod";

/** Longer words are cut when the transcript is saved and refused when a caption is edited. */
export const MAX_CAPTION_WORD_LENGTH = 60;

export const transcriptWordsSchema = z.array(
    z.object({
        text: z.string(),
        startSeconds: z.number(),
        endSeconds: z.number(),
    }),
);

export type TranscriptWord = z.infer<typeof transcriptWordsSchema>[number];
