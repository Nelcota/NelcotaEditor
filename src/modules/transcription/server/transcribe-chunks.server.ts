import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import type { AudioChunk } from "#/modules/transcription/server/extract-audio-chunks.server";
import { transcribeAudioChunk } from "#/modules/transcription/server/whisper-client.server";
import type { ChunkTranscription } from "#/modules/transcription/server/whisper-client.server";
import { createConcurrencyLimit } from "#/shared/server/create-concurrency-limit.server";
import { getEnvironment } from "#/shared/server/env.server";
import { runWithConcurrency } from "#/shared/server/run-with-concurrency.server";

const PERCENT = 100;
let transcriptionSlots: ReturnType<typeof createConcurrencyLimit> | null = null;

export interface Transcription {
    words: Array<TranscriptWord>;
    language: string | null;
}

export interface ChunksToTranscribe {
    chunks: Array<AudioChunk>;
    concurrency: number;
    language: string | null;
    signal: AbortSignal;
}

function joinChunks(results: Array<ChunkTranscription>): Transcription {
    const detectedLanguage = results.find((result) => result.language !== null)?.language ?? null;

    return { words: results.flatMap((result) => result.words), language: detectedLanguage };
}

/**
 * The first failed chunk aborts the requests still running, and the failure is only thrown once
 * they have all stopped: the caller deletes the WAV files they upload from right after.
 */
export async function transcribeChunks(
    input: ChunksToTranscribe,
    onProgress: (percent: number) => void,
): Promise<Transcription> {
    const { chunks, concurrency, language } = input;
    const slots = (transcriptionSlots ??= createConcurrencyLimit(
        getEnvironment().TRANSCRIPTION_CONCURRENCY,
    ));
    const siblingFailure = new AbortController();
    const signal = AbortSignal.any([input.signal, siblingFailure.signal]);
    const failures: Array<unknown> = [];
    let completedChunks = 0;
    const results = await runWithConcurrency(
        chunks,
        concurrency,
        async (chunk): Promise<Array<ChunkTranscription>> => {
            if (failures.length > 0) {
                return [];
            }

            try {
                const result = await slots.run(signal, () =>
                    transcribeAudioChunk(chunk, language, signal),
                );
                completedChunks += 1;
                onProgress((completedChunks / chunks.length) * PERCENT);
                return [result];
            } catch (error) {
                failures.push(error);
                siblingFailure.abort();
                return [];
            }
        },
    );

    if (failures.length > 0) {
        throw failures[0];
    }

    return joinChunks(results.flat());
}
