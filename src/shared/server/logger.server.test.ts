import { DrizzleQueryError } from "drizzle-orm/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { logger, withLogContext } from "#/shared/server/logger.server";

const logLineSchema = z.looseObject({ level: z.string(), message: z.string(), time: z.string() });

function captureLogLines(): () => Array<z.infer<typeof logLineSchema>> {
    const written: Array<string> = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
        written.push(String(chunk));
        return true;
    });

    return () => written.map((line) => logLineSchema.parse(JSON.parse(line)));
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("logger", () => {
    it("writes one JSON line with the level, the message and the fields", () => {
        const readLines = captureLogLines();

        logger.warn({ videoId: "v1" }, "Slow step");

        expect(readLines()).toEqual([
            expect.objectContaining({ level: "warn", message: "Slow step", videoId: "v1" }),
        ]);
    });

    it("keeps query values out of a logged database error", () => {
        const readLines = captureLogLines();
        const error = new DrizzleQueryError("select 1 where token = $1", ["share-token-123"]);

        logger.error({ error }, "Request failed");

        expect(JSON.stringify(readLines())).not.toContain("share-token-123");
    });

    it("redacts secrets up to two levels down, dashed names included", () => {
        const readLines = captureLogLines();

        logger.info(
            {
                password: "hunter2",
                headers: { cookie: "session=abc", "set-cookie": "session=def" },
                request: { headers: { authorization: "Bearer xyz" } },
            },
            "Signed in",
        );

        const serialized = JSON.stringify(readLines());
        expect(serialized).not.toContain("hunter2");
        expect(serialized).not.toContain("session=abc");
        expect(serialized).not.toContain("session=def");
        expect(serialized).not.toContain("Bearer xyz");
    });

    it("adds the request id to every line written inside its context", async () => {
        const readLines = captureLogLines();

        await withLogContext({ requestId: "request-1" }, async () => {
            logger.info({}, "Inside");
        });
        logger.info({}, "Outside");

        expect(readLines().map((line) => line["requestId"])).toEqual(["request-1", undefined]);
    });
});
