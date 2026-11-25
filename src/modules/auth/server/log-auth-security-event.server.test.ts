import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { withLogContext } from "#/shared/server/logger.server";

// The client IP is read from the header the rate limiter trusts, which the environment names.
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = "test-storage";
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";
process.env.TRUSTED_PROXY_IP_HEADER = "x-real-ip";

const { logAuthSecurityEvent } =
    await import("#/modules/auth/server/log-auth-security-event.server");

const CLIENT_IP = "203.0.113.7";

const logLineSchema = z.looseObject({ level: z.string(), message: z.string() });

function captureLogLines(): () => Array<z.infer<typeof logLineSchema>> {
    const written: Array<string> = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
        written.push(String(chunk));
        return true;
    });

    return () => written.map((line) => logLineSchema.parse(JSON.parse(line)));
}

function postTo(path: string): Request {
    return new Request(`http://localhost:3000/api/auth${path}`, {
        method: "POST",
        headers: { "x-real-ip": CLIENT_IP },
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("logAuthSecurityEvent", () => {
    it("warns with the client IP when the auth rate limit answers 429", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-up/email"), new Response(null, { status: 429 }));

        expect(readLines()).toEqual([
            expect.objectContaining({
                level: "warn",
                message: "Auth rate limit hit",
                path: "/sign-up/email",
                clientIp: CLIENT_IP,
            }),
        ]);
    });

    it("warns with the client IP when a sign-in fails", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-in/email"), new Response(null, { status: 401 }));

        expect(readLines()).toEqual([
            expect.objectContaining({
                level: "warn",
                message: "Sign-in failed",
                status: 401,
                clientIp: CLIENT_IP,
            }),
        ]);
    });

    it("carries the request id of the log context", async () => {
        const readLines = captureLogLines();

        const failedSignIn = new Response(null, { status: 401 });
        await withLogContext({ requestId: "request-1" }, () =>
            Promise.resolve(logAuthSecurityEvent(postTo("/sign-in/email"), failedSignIn)),
        );

        expect(readLines()).toEqual([expect.objectContaining({ requestId: "request-1" })]);
    });

    it("logs nothing for a successful sign-in", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-in/email"), new Response(null, { status: 200 }));

        expect(readLines()).toEqual([]);
    });

    it("logs nothing for other failed auth requests", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-up/email"), new Response(null, { status: 400 }));

        expect(readLines()).toEqual([]);
    });
});
