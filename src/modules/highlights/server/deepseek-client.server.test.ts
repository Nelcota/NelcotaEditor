import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APIError, APIUserAbortError, AuthenticationError } from "openai";
import {
    requestJsonCompletion,
    toUserFacingError,
} from "#/modules/highlights/server/deepseek-client.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const HTTP_PAYMENT_REQUIRED = 402;
const INTERNAL_DETAILS = /DEEPSEEK|DeepSeek|\.env|npm|saldo|chave/;

function isCustomerSafe(error: unknown): boolean {
    return error instanceof UserFacingError && INTERNAL_DETAILS.test(error.message) === false;
}

describe("deepseek toUserFacingError", () => {
    it("passes cancellation through untouched", () => {
        const abort = new APIUserAbortError();

        assert.equal(toUserFacingError(abort), abort);
    });

    it("maps an invalid key to a message without configuration details", () => {
        const invalidKey = new AuthenticationError(401, undefined, "bad key", new Headers());

        const result = toUserFacingError(invalidKey);

        assert.ok(isCustomerSafe(result));
        assert.ok(result instanceof Error);
        assert.equal(result.cause, invalidKey);
    });

    it("maps an account without credit to a message without configuration details", () => {
        const noCredit = new APIError(HTTP_PAYMENT_REQUIRED, undefined, "no credit", new Headers());

        assert.ok(isCustomerSafe(toUserFacingError(noCredit)));
    });
});

describe("requestJsonCompletion", () => {
    it("hides a missing key from the customer", async () => {
        process.env.DATABASE_URL = "postgres://test@127.0.0.1:9/test";
        process.env.STORAGE_DIR = "storage-test";
        process.env.WHISPER_URL = "http://127.0.0.1:9";
        process.env.WHISPER_MODEL = "test-model";
        process.env.DEEPSEEK_API_KEY = " ";

        const request = requestJsonCompletion({ system: "s", user: "u" }, AbortSignal.abort());

        await assert.rejects(request, isCustomerSafe);
    });
});
