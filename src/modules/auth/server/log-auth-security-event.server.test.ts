import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { logAuthSecurityEvent } from "#/modules/auth/server/log-auth-security-event.server";

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
    return new Request(`http://localhost:3000/api/auth${path}`, { method: "POST" });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("logAuthSecurityEvent", () => {
    it("warns when the auth rate limit answers 429", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-up/email"), new Response(null, { status: 429 }));

        expect(readLines()).toEqual([
            expect.objectContaining({
                level: "warn",
                message: "Auth rate limit hit",
                path: "/sign-up/email",
            }),
        ]);
    });

    it("warns when a sign-in fails", () => {
        const readLines = captureLogLines();

        logAuthSecurityEvent(postTo("/sign-in/email"), new Response(null, { status: 401 }));

        expect(readLines()).toEqual([
            expect.objectContaining({ level: "warn", message: "Sign-in failed", status: 401 }),
        ]);
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
