import { once } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AudioChunk } from "#/modules/transcription/server/extract-audio-chunks.server";
import { transcribeChunks } from "#/modules/transcription/server/transcribe-chunks.server";
import { transcribeAudioChunk } from "#/modules/transcription/server/whisper-client.server";

// Whisper is an external server; only its adapter is replaced.
vi.mock("#/modules/transcription/server/whisper-client.server", () => ({
    transcribeAudioChunk: vi.fn(),
}));

class ChunkFailedError extends Error {
    constructor() {
        super("Chunk failed");
        this.name = "ChunkFailedError";
    }
}

class RequestAbortedError extends Error {
    constructor() {
        super("Request aborted");
        this.name = "RequestAbortedError";
    }
}

const FAILING_CHUNK: AudioChunk = { absolutePath: "/audio/chunk-0000.wav", offsetSeconds: 0 };
const SLOW_CHUNK: AudioChunk = { absolutePath: "/audio/chunk-0001.wav", offsetSeconds: 120 };

/** Answers only when its request is aborted, like an SDK call that is still uploading. */
async function waitForAbort(signal: AbortSignal, events: Array<string>): Promise<never> {
    if (signal.aborted === false) {
        await once(signal, "abort");
    }

    events.push("slow request aborted");
    throw new RequestAbortedError();
}

afterEach(() => {
    vi.resetAllMocks();
});

describe("transcribeChunks", () => {
    it("aborts the other requests when one chunk fails, and waits for them before rejecting", async () => {
        const events: Array<string> = [];
        vi.mocked(transcribeAudioChunk).mockImplementation(async (chunk, _language, signal) => {
            if (chunk === FAILING_CHUNK) {
                throw new ChunkFailedError();
            }

            return waitForAbort(signal, events);
        });

        const run = transcribeChunks(
            {
                chunks: [SLOW_CHUNK, FAILING_CHUNK],
                language: "pt",
                signal: new AbortController().signal,
            },
            () => undefined,
        );
        await expect(run).rejects.toThrow(ChunkFailedError);
        events.push("run rejected");

        expect(events).toEqual(["slow request aborted", "run rejected"]);
    });

    it("stops every request when the run is cancelled", async () => {
        const events: Array<string> = [];
        const cancellation = new AbortController();
        vi.mocked(transcribeAudioChunk).mockImplementation(async (_chunk, _language, signal) =>
            waitForAbort(signal, events),
        );

        const run = transcribeChunks(
            { chunks: [SLOW_CHUNK, FAILING_CHUNK], language: "pt", signal: cancellation.signal },
            () => undefined,
        );
        cancellation.abort();

        await expect(run).rejects.toThrow(RequestAbortedError);
        expect(events).toEqual(["slow request aborted", "slow request aborted"]);
    });

    it("joins the words of every chunk in order with the first detected language", async () => {
        vi.mocked(transcribeAudioChunk).mockImplementation(async (chunk) => ({
            language: "pt",
            words: [
                {
                    text: chunk.absolutePath,
                    startSeconds: chunk.offsetSeconds,
                    endSeconds: chunk.offsetSeconds + 1,
                },
            ],
        }));

        const transcription = await transcribeChunks(
            {
                chunks: [FAILING_CHUNK, SLOW_CHUNK],
                language: null,
                signal: new AbortController().signal,
            },
            () => undefined,
        );

        expect(transcription.language).toBe("pt");
        expect(transcription.words.map((word) => word.startSeconds)).toEqual([0, 120]);
    });
});
