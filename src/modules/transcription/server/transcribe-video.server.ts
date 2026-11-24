import { rm } from "node:fs/promises";
import path from "node:path";
import { db } from "#/db/database.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { extractAudioChunks } from "#/modules/transcription/server/extract-audio-chunks.server";
import type { AudioChunk } from "#/modules/transcription/server/extract-audio-chunks.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import {
    ensureWhisperModel,
    transcribeAudioChunk,
} from "#/modules/transcription/server/whisper-client.server";
import type { ChunkTranscription } from "#/modules/transcription/server/whisper-client.server";
import { runWithConcurrency } from "#/shared/server/run-with-concurrency.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

/**
 * Chunks sent to Whisper at once. Measured on 8 CPU cores with speaches running 4 workers of
 * 2 threads: 3 parallel requests transcribed 10 minutes of audio in 51s (165s one at a time).
 */
const TRANSCRIPTION_CONCURRENCY = 3;
const PERCENT = 100;

interface Transcription {
    words: Array<TranscriptWord>;
    language: string | null;
}

interface ChunksToTranscribe {
    chunks: Array<AudioChunk>;
    language: string | null;
    signal: AbortSignal;
}

async function transcribeChunks(
    input: ChunksToTranscribe,
    onProgress: (percent: number) => void,
): Promise<Transcription> {
    const { chunks, language, signal } = input;
    let completedChunks = 0;
    const results = await runWithConcurrency(
        chunks,
        TRANSCRIPTION_CONCURRENCY,
        async (chunk): Promise<ChunkTranscription> => {
            const result = await transcribeAudioChunk(chunk, language, signal);
            completedChunks += 1;
            onProgress((completedChunks / chunks.length) * PERCENT);
            return result;
        },
    );
    const detectedLanguage = results.find((result) => result.language !== null)?.language ?? null;

    return { words: results.flatMap((result) => result.words), language: detectedLanguage };
}

interface TranscriptRequest {
    videoId: string;
    sourcePath: string;
    /** The video's language (from the user's preferences); null lets Whisper detect it. */
    language: string | null;
    signal: AbortSignal;
    /** Records this step's own progress (0 to 100); the pipeline maps it onto the whole run. */
    saveProgress: (stagePercent: number) => Promise<void>;
}

/** Splits the audio, transcribes it and always removes the WAV chunks, which can be large. */
async function transcribeAudio(request: TranscriptRequest): Promise<Transcription> {
    const { videoId, sourcePath, language, signal, saveProgress } = request;
    const audioDirectory = resolveStoragePath(path.posix.join(getVideoDirectory(videoId), "audio"));

    try {
        const chunks = await extractAudioChunks(
            resolveStoragePath(sourcePath),
            audioDirectory,
            signal,
        );

        // Also keeps transcribeChunks from dividing by zero when it reports progress.
        if (chunks.length === 0) {
            throw new UserFacingError("Não foi possível extrair o áudio do vídeo.");
        }

        const startedAt = performance.now();
        const transcription = await runWithProgress(
            (onProgress) => transcribeChunks({ chunks, language, signal }, onProgress),
            saveProgress,
        );
        const durationMs = Math.round(performance.now() - startedAt);
        logger.info(
            {
                videoId,
                chunkCount: chunks.length,
                wordCount: transcription.words.length,
                language: transcription.language ?? null,
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
    await db.insert(transcripts).values({ videoId, ...transcription });
    return transcription.words;
}
