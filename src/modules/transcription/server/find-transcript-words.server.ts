import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import { transcripts } from "#/modules/transcription/transcription.schema";

/**
 * The saved word-level transcript, or null when the video has none yet. null is not [] on
 * purpose: a transcript of a silent video is empty but exists, and must not be made again.
 */
export async function findTranscriptWords(videoId: string): Promise<Array<TranscriptWord> | null> {
    const rows = await db
        .select({ words: transcripts.words })
        .from(transcripts)
        .where(eq(transcripts.videoId, videoId))
        .limit(1);
    const transcript = rows[0];

    if (transcript === undefined) {
        return null;
    }

    return transcript.words;
}
