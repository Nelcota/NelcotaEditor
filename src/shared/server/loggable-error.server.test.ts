import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import { toLoggableError } from "#/shared/server/loggable-error.server";
import { formatLogLine } from "#/shared/server/logger.server";

const PERSONAL_VALUES = ["ana@example.com", "https://youtu.be/dQw4w9WgXcQ", "share-token-123"];

function createUniqueViolation(): DatabaseError {
    const error = new DatabaseError(
        'duplicate key value violates unique constraint "user_email_unique"',
        0,
        "error",
    );
    error.code = "23505";
    error.severity = "ERROR";
    error.constraint = "user_email_unique";
    error.table = "user";
    error.detail = "Key (email)=(ana@example.com) already exists.";
    return error;
}

function createFailedQuery(): DrizzleQueryError {
    return new DrizzleQueryError(
        'insert into "video" ("title", "url", "token") values ($1, $2, $3)',
        PERSONAL_VALUES,
        createUniqueViolation(),
    );
}

describe("toLoggableError", () => {
    it("drops the query parameters and row values of a failed database query", () => {
        const serialized = JSON.stringify(toLoggableError(createFailedQuery()));

        for (const value of PERSONAL_VALUES) {
            assert.equal(serialized.includes(value), false, value);
        }
    });

    it("keeps the PostgreSQL code and constraint so the failure can still be diagnosed", () => {
        const loggable = toLoggableError(createFailedQuery());

        assert.equal(loggable.name, "DrizzleQueryError");
        assert.equal(loggable.cause?.code, "23505");
        assert.equal(loggable.cause?.constraint, "user_email_unique");
        assert.equal(loggable.cause?.table, "user");
    });

    it("keeps the name and message of an ordinary error and its cause", () => {
        const error = new Error("Worker crashed", { cause: new RangeError("Out of range") });

        assert.deepEqual(toLoggableError(error), {
            name: "Error",
            message: "Worker crashed",
            cause: { name: "RangeError", message: "Out of range" },
        });
    });

    it("keeps the system code of a connection failure, whose message is empty", () => {
        const refused = Object.assign(new AggregateError([], ""), { code: "ECONNREFUSED" });

        const loggable = toLoggableError(new DrizzleQueryError("select 1", [], refused));

        assert.equal(loggable.cause?.code, "ECONNREFUSED");
    });

    it("describes a thrown value that is not an error without printing it", () => {
        assert.deepEqual(toLoggableError("ana@example.com"), {
            name: "NonErrorThrown",
            message: "A string was thrown",
        });
    });
});

describe("formatLogLine", () => {
    it("writes one JSON line with the level, message and context", () => {
        const line = JSON.parse(formatLogLine("warn", "Slow step", { videoId: "v1" }));

        assert.equal(line.level, "warn");
        assert.equal(line.message, "Slow step");
        assert.equal(line.videoId, "v1");
    });

    it("sanitizes the error in the context", () => {
        const line = formatLogLine("error", "Request failed", { error: createFailedQuery() });

        for (const value of PERSONAL_VALUES) {
            assert.equal(line.includes(value), false, value);
        }
    });
});
