import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { transcriptWordsSchema } from "#/modules/transcription/model/transcript-word";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { logger } from "#/shared/server/logger.server";

type SavedTranscript = Pick<typeof transcripts.$inferSelect, "language" | "words">;

/** A missing or unusable transcript can be rebuilt, while a valid empty transcript is kept. */
export async function findSavedTranscript(videoId: string): Promise<SavedTranscript | null> {
    const rows = await db
        .select({ language: transcripts.language, words: transcripts.words })
        .from(transcripts)
        .where(eq(transcripts.videoId, videoId))
        .limit(1);
    const transcript = rows[0];

    if (transcript === undefined) {
        return null;
    }

    const result = transcriptWordsSchema.safeParse(transcript.words);

    if (result.success === false) {
        logger.warn({ videoId }, "Stored transcript requires regeneration");
        return null;
    }

    return { language: transcript.language, words: result.data };
}

export async function findTranscriptWords(videoId: string): Promise<Array<TranscriptWord> | null> {
    const transcript = await findSavedTranscript(videoId);
    return transcript?.words ?? null;
}
