import { openAsBlob } from "node:fs";
import OpenAI, { APIConnectionError, APIError, APIUserAbortError, toFile } from "openai";
import { z } from "zod";
import { MAX_CAPTION_WORD_LENGTH } from "#/modules/transcription/transcript-word";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import { AUDIO_CHUNK_SECONDS } from "#/modules/transcription/server/extract-audio-chunks.server";
import type { AudioChunk } from "#/modules/transcription/server/extract-audio-chunks.server";
import { getEnvironment } from "#/shared/server/env.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

// speaches implements the OpenAI audio API and ignores the key, but the SDK requires one.
const LOCAL_API_KEY = "speaches";
const MAX_RETRIES = 2;

const TRANSCRIPTION_UNAVAILABLE_MESSAGE =
    "A transcrição está indisponível agora. Tente de novo em alguns minutos.";
const TRANSCRIPTION_FAILED_MESSAGE =
    "Não conseguimos transcrever a fala deste vídeo. Tente de novo em alguns minutos.";

// The SDK types the answer but does not check it. speaches answers `words: []` for silence and
// `words: null` when it produced no word timestamps; only the first is a real empty chunk, so a
// missing list must fail instead of being saved as a transcript with no speech.
const whisperResponseSchema = z.object({
    language: z.string().trim().min(1).optional().catch(undefined),
    words: z.array(z.object({ word: z.string(), start: z.number(), end: z.number() })),
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

/**
 * Says the transcription is the step that failed instead of the generic failure; the SDK error
 * stays as the cause, for the server log. Cancellation passes through untouched.
 * APIConnectionTimeoutError extends APIConnectionError.
 */
export function toUserFacingError(error: unknown): unknown {
    if (error instanceof APIUserAbortError || error instanceof APIError === false) {
        return error;
    }

    if (error instanceof APIConnectionError) {
        return new UserFacingError(TRANSCRIPTION_UNAVAILABLE_MESSAGE, { cause: error });
    }

    return new UserFacingError(TRANSCRIPTION_FAILED_MESSAGE, { cause: error });
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
    try {
        await client.post(`/models/${environment.WHISPER_MODEL}`);
    } catch (error) {
        throw toUserFacingError(error);
    }
}

function toLanguageOption(language: string): { language?: string } {
    if (language.length === 0) {
        return {};
    }

    return { language };
}

function clampToChunk(seconds: number): number {
    return Math.min(AUDIO_CHUNK_SECONDS, Math.max(0, seconds));
}

/**
 * Whisper sometimes reports a slightly negative start, an end before the start, or an end past
 * the chunk. Clamping to the chunk keeps words of neighbouring chunks from overlapping, which the
 * Studio draft rejects. Words are cut to the caption limit (a spoken URL can be longer).
 */
function toTranscriptWord(word: WhisperWord, offsetSeconds: number): TranscriptWord {
    const startSeconds = clampToChunk(word.start);
    const endSeconds = Math.max(startSeconds, clampToChunk(word.end));
    const text = Array.from(word.word.trim()).slice(0, MAX_CAPTION_WORD_LENGTH).join("");

    return {
        text,
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

/** The video's own choice wins, "" (detect automatically) included; null is a video from before 0002. */
function resolveLanguage(videoLanguage: string | null): string {
    if (videoLanguage !== null) {
        return videoLanguage;
    }

    const environment = getEnvironment();
    return environment.WHISPER_LANGUAGE.trim();
}

export function toChunkTranscription(response: unknown, offsetSeconds: number): ChunkTranscription {
    const result = whisperResponseSchema.safeParse(response);

    if (result.success === false) {
        throw new UserFacingError(TRANSCRIPTION_FAILED_MESSAGE, {
            cause: new WhisperResponseError(),
        });
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
    let transcription: unknown = null;

    try {
        transcription = await client.audio.transcriptions.create(
            {
                file: audio,
                model: environment.WHISPER_MODEL,
                response_format: "verbose_json",
                timestamp_granularities: ["word"],
                ...toLanguageOption(resolveLanguage(videoLanguage)),
            },
            { signal },
        );
    } catch (error) {
        throw toUserFacingError(error);
    }

    return toChunkTranscription(transcription, chunk.offsetSeconds);
}
