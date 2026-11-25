import { rm } from "node:fs/promises";
import path from "node:path";
import { db } from "#/db/database.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { transcribeChunks } from "#/modules/transcription/server/transcribe-chunks.server";
import type { Transcription } from "#/modules/transcription/server/transcribe-chunks.server";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { extractAudioChunks } from "#/modules/transcription/server/extract-audio-chunks.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { ensureWhisperModel } from "#/modules/transcription/server/whisper-client.server";
import { getEnvironment } from "#/shared/server/env.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

const AUDIO_DIRECTORY_NAME = "audio";

interface TranscriptRequest {
    videoId: string;
    /** A local copy of the source that ffmpeg can read. */
    localSourcePath: string;
    /** The run's folder; the audio chunks are written here. */
    workDirectory: string;
    /** The video's language (from the user's preferences); null lets Whisper detect it. */
    language: string | null;
    signal: AbortSignal;
    /** Records this step's own progress (0 to 100); the pipeline maps it onto the whole run. */
    saveProgress: (stagePercent: number) => Promise<void>;
}

/** Splits the audio, transcribes it and always removes the WAV chunks, which can be large. */
async function transcribeAudio(request: TranscriptRequest): Promise<Transcription> {
    const { videoId, localSourcePath, workDirectory, language, signal, saveProgress } = request;
    const { TRANSCRIPTION_CONCURRENCY: concurrency } = getEnvironment();
    const audioDirectory = path.join(workDirectory, AUDIO_DIRECTORY_NAME);

    try {
        const extractStartedAt = performance.now();
        const chunks = await extractAudioChunks(localSourcePath, audioDirectory, signal);

        // Also keeps transcribeChunks from dividing by zero when it reports progress.
        if (chunks.length === 0) {
            throw new UserFacingError("Não foi possível extrair o áudio do vídeo.");
        }

        const extractDurationMs = Math.round(performance.now() - extractStartedAt);
        const startedAt = performance.now();
        const transcription = await runWithProgress(
            (onProgress) => transcribeChunks({ chunks, concurrency, language, signal }, onProgress),
            saveProgress,
        );
        const durationMs = Math.round(performance.now() - startedAt);
        logger.info(
            {
                videoId,
                chunkCount: chunks.length,
                wordCount: transcription.words.length,
                language: transcription.language ?? null,
                extractDurationMs,
                durationMs,
            },
            "Video transcribed",
        );
        return transcription;
    } finally {
        await rm(audioDirectory, { recursive: true, force: true });
    }
}

/** Returns the word-level transcript, creating it only when it does not exist yet. */
export async function ensureTranscript(request: TranscriptRequest): Promise<Array<TranscriptWord>> {
    const { videoId, saveProgress } = request;
    const existingWords = await findTranscriptWords(videoId);

    if (existingWords !== null) {
        return existingWords;
    }

    await saveProgress(0);
    await ensureWhisperModel(request.signal);

    const transcription = await transcribeAudio(request);
    await db
        .insert(transcripts)
        .values({ videoId, ...transcription })
        .onConflictDoUpdate({ target: transcripts.videoId, set: transcription });
    return transcription.words;
}
