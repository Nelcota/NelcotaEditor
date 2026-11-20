import { openAsBlob } from "node:fs";
import OpenAI, { toFile } from "openai";
import { z } from "zod";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import type { AudioChunk } from "#/modules/transcription/server/extract-audio-chunks.server";
import { getEnvironment } from "#/shared/server/env.server";

// speaches implements the OpenAI audio API and ignores the key, but the SDK requires one.
const LOCAL_API_KEY = "speaches";
const MAX_RETRIES = 2;

// The SDK types the answer but does not check it; speaches may leave fields out.
const whisperResponseSchema = z.object({
    language: z.string().trim().min(1).optional().catch(undefined),
    words: z.array(z.object({ word: z.string(), start: z.number(), end: z.number() })).default([]),
});

type WhisperWord = z.infer<typeof whisperResponseSchema>["words"][number];

export class WhisperResponseError extends Error {
    constructor() {
        super("Whisper server answered with an unexpected response shape");
        this.name = "WhisperResponseError";
    }
}

export interface ChunkTranscription {
    language: string | null;
    words: Array<TranscriptWord>;
}

function createWhisperClient(): OpenAI {
    const environment = getEnvironment();

    return new OpenAI({
        apiKey: LOCAL_API_KEY,
        baseURL: `${environment.WHISPER_URL}/v1`,
        maxRetries: MAX_RETRIES,
    });
}

/** Downloads the model on first use; speaches answers 201 when it is already there. */
export async function ensureWhisperModel(): Promise<void> {
    const environment = getEnvironment();
    const client = createWhisperClient();

    // A speaches-only route, so it goes through the SDK's generic POST (same retries and errors).
    await client.post(`/models/${environment.WHISPER_MODEL}`);
}

function toLanguageOption(language: string): { language?: string } {
    if (language.length === 0) {
        return {};
    }

    return { language };
}

/** Whisper sometimes reports a slightly negative start or an end before the start; clamp both. */
function toTranscriptWord(word: WhisperWord, offsetSeconds: number): TranscriptWord {
    const startSeconds = Math.max(0, word.start);
    const endSeconds = Math.max(startSeconds, word.end);

    return {
        text: word.word.trim(),
        startSeconds: startSeconds + offsetSeconds,
        endSeconds: endSeconds + offsetSeconds,
    };
}

function toTranscriptWords(
    words: Array<WhisperWord>,
    offsetSeconds: number,
): Array<TranscriptWord> {
    return words
        .map((word) => toTranscriptWord(word, offsetSeconds))
        .filter((word) => word.text.length > 0);
}

/** The video's own language wins; otherwise the server-wide WHISPER_LANGUAGE (may be empty). */
function resolveLanguage(videoLanguage: string | null): string {
    if (videoLanguage !== null) {
        return videoLanguage;
    }

    const environment = getEnvironment();
    return environment.WHISPER_LANGUAGE.trim();
}

function toChunkTranscription(response: unknown, offsetSeconds: number): ChunkTranscription {
    const result = whisperResponseSchema.safeParse(response);

    if (result.success === false) {
        throw new WhisperResponseError();
    }

    const verified = result.data;

    return {
        language: verified.language ?? null,
        words: toTranscriptWords(verified.words, offsetSeconds),
    };
}

export async function transcribeAudioChunk(
    chunk: AudioChunk,
    videoLanguage: string | null,
    signal: AbortSignal,
): Promise<ChunkTranscription> {
    const environment = getEnvironment();
    const client = createWhisperClient();
    const audio = await toFile(await openAsBlob(chunk.absolutePath), "audio.wav");
    const transcription = await client.audio.transcriptions.create(
        {
            file: audio,
            model: environment.WHISPER_MODEL,
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            ...toLanguageOption(resolveLanguage(videoLanguage)),
        },
        { signal },
    );

    return toChunkTranscription(transcription, chunk.offsetSeconds);
}
