import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { buildTranscriptLines } from "#/modules/transcription/build-transcript-lines";
import { transcripts } from "#/modules/transcription/transcription.schema";
import type { TranscriptView } from "#/modules/transcription/transcript-view";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";

const transcriptInputSchema = z.object({ videoId: z.uuid() });

/** The video's transcript in readable lines; null while Tinta has not finished it. */
export const getVideoTranscript = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(transcriptInputSchema)
    .handler(async ({ context, data }): Promise<TranscriptView | null> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const rows = await db
            .select({ language: transcripts.language, words: transcripts.words })
            .from(transcripts)
            .where(eq(transcripts.videoId, video.id))
            .limit(1);
        const transcript = rows[0];

        if (transcript === undefined) {
            return null;
        }

        return { language: transcript.language, lines: buildTranscriptLines(transcript.words) };
    });
