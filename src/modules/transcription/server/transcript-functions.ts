import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { buildTranscriptLines } from "#/modules/transcription/model/build-transcript-lines";
import { findSavedTranscript } from "#/modules/transcription/server/find-transcript-words.server";
import type { TranscriptView } from "#/modules/transcription/model/transcript-view";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";

const transcriptInputSchema = z.object({ videoId: z.uuid() });

/** The video's transcript in readable lines; null while Tinta has not finished it. */
export const getVideoTranscript = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(transcriptInputSchema)
    .handler(async ({ context, data }): Promise<TranscriptView | null> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const transcript = await findSavedTranscript(video.id);

        if (transcript === null) {
            return null;
        }

        return { language: transcript.language, lines: buildTranscriptLines(transcript.words) };
    });
