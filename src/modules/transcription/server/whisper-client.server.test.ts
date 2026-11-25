import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setImmediate as yieldToInputOutput } from "node:timers/promises";
import { afterAll, describe, it, vi } from "vitest";
import { APIConnectionError, APIConnectionTimeoutError, APIError, APIUserAbortError } from "openai";
import {
    ensureWhisperModel,
    toChunkTranscription,
    toUserFacingError,
    transcribeAudioChunk,
} from "#/modules/transcription/server/whisper-client.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const HTTP_INTERNAL_SERVER_ERROR = 500;
const SECOND_MILLISECONDS = 1_000;
// Two attempts of 180s each, plus the backoff between them; a third attempt would pass this.
const LONGEST_CHUNK_WAIT_MILLISECONDS = 7 * 60 * SECOND_MILLISECONDS;

// A Whisper server that takes every request and never answers.
const silentServer = createServer(() => undefined);
silentServer.listen(0, "127.0.0.1");
await once(silentServer, "listening");
const serverAddress: AddressInfo | string | null = silentServer.address();

if (serverAddress === null || typeof serverAddress === "string") {
    throw new Error("The silent Whisper server has no port");
}

process.env.DATABASE_URL = "postgres://test@127.0.0.1:9/test";
process.env.STORAGE_DIR = "storage-test";
process.env.WHISPER_URL = `http://127.0.0.1:${serverAddress.port}`;
process.env.WHISPER_MODEL = "test-model";

afterAll(() => {
    silentServer.closeAllConnections();
    silentServer.close();
});

interface Outcome {
    error: unknown;
}

interface WatchedRun {
    isSettled: boolean;
}

async function captureFailure(run: Promise<unknown>, watched: WatchedRun): Promise<Outcome> {
    try {
        await run;
        return { error: null };
    } catch (error) {
        return { error };
    } finally {
        watched.isSettled = true;
    }
}

function isTranscriptionFailure(error: unknown): boolean {
    return error instanceof UserFacingError && error.message.includes("transcrever") === true;
}

describe("toChunkTranscription", () => {
    it("keeps a silent chunk as an empty list of words", () => {
        const result = toChunkTranscription({ language: "pt", words: [] }, 0);

        assert.deepEqual(result, { language: "pt", words: [] });
    });

    it("refuses an answer without words instead of saving an empty transcript", () => {
        assert.throws(() => toChunkTranscription({ language: "pt" }, 0), isTranscriptionFailure);
    });

    it("refuses an answer whose words are null", () => {
        assert.throws(
            () => toChunkTranscription({ language: "pt", words: null }, 0),
            isTranscriptionFailure,
        );
    });

    it("shifts the words by the chunk offset", () => {
        const response = { words: [{ word: " oi", start: 1, end: 1.5 }] };

        const result = toChunkTranscription(response, 120);

        assert.deepEqual(result.words, [{ text: "oi", startSeconds: 121, endSeconds: 121.5 }]);
    });
});

describe("ensureWhisperModel", () => {
    it("stops waiting for the model as soon as the video is cancelled", async () => {
        // The server never answers: without the signal the wait would last until the timeout.
        const download = ensureWhisperModel(AbortSignal.abort());

        await assert.rejects(download, APIUserAbortError);
    });
});

describe("transcribeAudioChunk", () => {
    it("gives up on a chunk the server never answers, saying transcription is unavailable", async () => {
        const audioDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-whisper-"));
        const chunkPath = path.join(audioDirectory, "chunk-0000.wav");
        await writeFile(chunkPath, "not really audio");
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const watched: WatchedRun = { isSettled: false };
        const run = captureFailure(
            transcribeAudioChunk(
                { absolutePath: chunkPath, offsetSeconds: 0 },
                "pt",
                new AbortController().signal,
            ),
            watched,
        );

        // Connecting needs real input and output between each fake second.
        for (
            let waitedMilliseconds = 0;
            watched.isSettled === false && waitedMilliseconds < LONGEST_CHUNK_WAIT_MILLISECONDS;
            waitedMilliseconds += SECOND_MILLISECONDS
        ) {
            await yieldToInputOutput();
            await vi.advanceTimersByTimeAsync(SECOND_MILLISECONDS);
        }

        vi.useRealTimers();
        silentServer.closeAllConnections();
        const result = await run;
        await rm(audioDirectory, { recursive: true, force: true });
        assert.ok(result.error instanceof UserFacingError);
        assert.match(result.error.message, /indisponível/);
        assert.ok(result.error.cause instanceof APIConnectionTimeoutError);
    });
});

describe("toUserFacingError", () => {
    it("passes cancellation through untouched", () => {
        const abort = new APIUserAbortError();

        assert.equal(toUserFacingError(abort), abort);
    });

    it("says the transcription is unavailable when the server cannot be reached", () => {
        const result = toUserFacingError(new APIConnectionError({ message: "down" }));

        assert.ok(result instanceof UserFacingError);
        assert.match(result.message, /indisponível/);
    });

    it("says the transcription failed for a server error, keeping the cause for the log", () => {
        const serverError = new APIError(
            HTTP_INTERNAL_SERVER_ERROR,
            undefined,
            "boom",
            new Headers(),
        );

        const result = toUserFacingError(serverError);

        assert.ok(isTranscriptionFailure(result));
        assert.ok(result instanceof Error);
        assert.equal(result.cause, serverError);
    });
});
