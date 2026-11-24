import assert from "node:assert/strict";
import { describe, test } from "vitest";

// Behind a proxy the client IP comes from its header, so no request event is needed here.
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = "test-storage";
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";
process.env.TRUSTED_PROXY_IP_HEADER = "x-real-ip";

const { AuthBodyTooLargeError, MAX_AUTH_BODY_BYTES, prepareAuthRequest } =
    await import("#/modules/auth/server/client-ip.server");

const SIGN_IN_URL = "http://localhost:3000/api/auth/sign-in/email";

describe("prepareAuthRequest", () => {
    test("keeps a small body as it was sent", async () => {
        const body = JSON.stringify({ email: "ana@example.com", password: "12345678" });
        const request = new Request(SIGN_IN_URL, { method: "POST", body });

        const prepared = await prepareAuthRequest(request);

        assert.equal(await prepared.text(), body);
    });

    test("refuses a body larger than the limit while reading it", async () => {
        const request = new Request(SIGN_IN_URL, {
            method: "POST",
            body: new Uint8Array(MAX_AUTH_BODY_BYTES + 1),
        });

        await assert.rejects(prepareAuthRequest(request), AuthBodyTooLargeError);
    });

    test("refuses a declared length above the limit before reading the body", async () => {
        const request = new Request(SIGN_IN_URL, {
            method: "POST",
            headers: { "content-length": String(MAX_AUTH_BODY_BYTES + 1) },
            body: new Uint8Array(1),
        });

        await assert.rejects(prepareAuthRequest(request), AuthBodyTooLargeError);
    });
});
