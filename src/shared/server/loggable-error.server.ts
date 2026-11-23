import { DrizzleQueryError } from "drizzle-orm/errors";

/** The parts of an error that are safe to write to the log: never query values or row data. */
export interface LoggableError {
    name: string;
    message: string;
    code?: string;
    constraint?: string;
    table?: string;
    column?: string;
    cause?: LoggableError;
}

const MAX_CAUSE_DEPTH = 3;
const POSTGRES_ERROR_MESSAGE = "PostgreSQL error";
const QUERY_FAILED_MESSAGE = "Database query failed";

/**
 * Drizzle puts every query parameter in the message (titles, links, e-mails, share tokens) and
 * PostgreSQL errors repeat row values in `message`/`detail` ("Key (email)=(...)"), so database
 * errors keep only their kind, SQLSTATE code and schema names.
 */
export function toLoggableError(error: unknown): LoggableError {
    return toLoggableErrorAtDepth(error, 0);
}

function toLoggableErrorAtDepth(error: unknown, depth: number): LoggableError {
    if (error instanceof DrizzleQueryError) {
        return withCause(
            { name: "DrizzleQueryError", message: QUERY_FAILED_MESSAGE },
            error,
            depth,
        );
    }

    if (error instanceof Error === false) {
        return { name: "NonErrorThrown", message: `A ${typeof error} was thrown` };
    }

    if (isPostgresError(error)) {
        return toLoggablePostgresError(error);
    }

    return withCause({ name: error.name, message: error.message }, error, depth);
}

function withCause(loggable: LoggableError, error: Error, depth: number): LoggableError {
    const cause = error.cause;

    if (cause === undefined || depth >= MAX_CAUSE_DEPTH) {
        return loggable;
    }

    return { ...loggable, cause: toLoggableErrorAtDepth(cause, depth + 1) };
}

interface PostgresErrorFields {
    code: string;
    constraint?: unknown;
    table?: unknown;
    column?: unknown;
}

/** node-postgres DatabaseError: a 5-character SQLSTATE `code` and a `severity`. */
function isPostgresError(error: Error): error is Error & PostgresErrorFields {
    const code: unknown = Reflect.get(error, "code");
    const severity: unknown = Reflect.get(error, "severity");
    return typeof code === "string" && code.length === 5 && typeof severity === "string";
}

function toLoggablePostgresError(error: Error & PostgresErrorFields): LoggableError {
    const loggable: LoggableError = { name: error.name, message: POSTGRES_ERROR_MESSAGE };
    loggable.code = error.code;

    if (typeof error.constraint === "string") {
        loggable.constraint = error.constraint;
    }

    if (typeof error.table === "string") {
        loggable.table = error.table;
    }

    if (typeof error.column === "string") {
        loggable.column = error.column;
    }

    return loggable;
}
