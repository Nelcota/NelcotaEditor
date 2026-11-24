import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

process.env.DATABASE_URL = "postgres://test@127.0.0.1:9/test";
process.env.STORAGE_DIR = "storage-test";
process.env.WHISPER_URL = "http://127.0.0.1:9";
process.env.WHISPER_MODEL = "test-model";
process.env.RESEND_API_KEY = "re_test_key";
process.env.EMAIL_FROM = "Nelcota <nao-responda@tela.nelcota.com>";

const { EmailRejectedError, sendEmail } = await import("#/shared/server/email/send-email.server");

const EMAIL = {
    to: "ana@example.com",
    subject: "Confirme seu email no Nelcota",
    html: "<p>Oi</p>",
    text: "Oi",
    idempotencyKey: "auth-email/job-1",
};

const HTTP_OK = 200;
const HTTP_UNPROCESSABLE = 422;

function readSentRequest(fetchMock: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } {
    const call = fetchMock.mock.calls[0];

    if (call === undefined) {
        throw new Error("fetch was not called");
    }

    const [url, init] = call;

    if (typeof url !== "string" || typeof init !== "object" || init === null) {
        throw new Error("fetch was called with unexpected arguments");
    }

    return { url, init };
}

describe("sendEmail", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn(
            async () => new Response(JSON.stringify({ id: "1" }), { status: HTTP_OK }),
        );
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("posts the email to Resend with the key, the sender and the idempotency key", async () => {
        await sendEmail(EMAIL);

        const { url, init } = readSentRequest(fetchMock);
        const headers = new Headers(init.headers);
        const body = init.body;

        if (typeof body !== "string") {
            throw new Error("The request body is not JSON text");
        }

        assert.equal(url, "https://api.resend.com/emails");
        assert.equal(headers.get("authorization"), "Bearer re_test_key");
        assert.equal(headers.get("idempotency-key"), "auth-email/job-1");
        assert.deepEqual(JSON.parse(body), {
            from: "Nelcota <nao-responda@tela.nelcota.com>",
            to: ["ana@example.com"],
            subject: EMAIL.subject,
            html: EMAIL.html,
            text: EMAIL.text,
        });
    });

    it("throws when Resend refuses the email, so the job is retried", async () => {
        fetchMock.mockResolvedValueOnce(new Response("{}", { status: HTTP_UNPROCESSABLE }));

        await assert.rejects(sendEmail(EMAIL), EmailRejectedError);
    });

    it("rejects an email without a recipient", async () => {
        await assert.rejects(sendEmail({ ...EMAIL, to: " " }), RangeError);
        assert.equal(fetchMock.mock.calls.length, 0);
    });
});
