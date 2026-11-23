import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APIConnectionError, APIError, APIUserAbortError } from "openai";
import {
    ensureWhisperModel,
    toChunkTranscription,
    toUserFacingError,
} from "#/modules/transcription/server/whisper-client.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const HTTP_INTERNAL_SERVER_ERROR = 500;

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
        // Nothing listens on port 9: without the signal the SDK would retry and fail to connect.
        process.env.DATABASE_URL = "postgres://test@127.0.0.1:9/test";
        process.env.STORAGE_DIR = "storage-test";
        process.env.WHISPER_URL = "http://127.0.0.1:9";
        process.env.WHISPER_MODEL = "test-model";

        const download = ensureWhisperModel(AbortSignal.abort());

        await assert.rejects(download, APIUserAbortError);
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
