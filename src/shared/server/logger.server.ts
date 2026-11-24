import { AsyncLocalStorage } from "node:async_hooks";
import { pino } from "pino";
import { toLoggableError } from "#/shared/server/loggable-error.server";

/** Ids that tie log lines to one request or one job; never personal data. */
export type LogContext = Readonly<Record<string, string>>;

const logContextStorage = new AsyncLocalStorage<LogContext>();

// Bracket notation, which redact paths need for a name with a dash such as set-cookie.
const SECRET_FIELDS = [
    "authorization",
    "cookie",
    "set-cookie",
    "password",
    "token",
    "secret",
    "apiKey",
];
const SECRET_FIELD_PATHS = SECRET_FIELDS.flatMap((field) => [
    `["${field}"]`,
    `*["${field}"]`,
    `*.*["${field}"]`,
]);

const DEFAULT_LEVEL = "info";

/**
 * One JSON object per line on stdout, so the log collector can filter by level, requestId or
 * videoId. Writing through process.stdout (not pino's own file descriptor) lets tests read it.
 */
export const logger = pino(
    {
        level: process.env.LOG_LEVEL ?? DEFAULT_LEVEL,
        base: null,
        messageKey: "message",
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: { level: (label) => ({ level: label }) },
        // Database errors repeat query values and row data; only their kind and codes are kept.
        serializers: { error: toLoggableError },
        redact: { paths: SECRET_FIELD_PATHS, censor: "[redacted]" },
        mixin: () => logContextStorage.getStore() ?? {},
    },
    process.stdout,
);

/** Runs `work` with these fields added to every log line written inside it. */
export async function withLogContext<Result>(
    context: LogContext,
    work: () => Promise<Result>,
): Promise<Result> {
    if (Object.keys(context).length === 0) {
        throw new RangeError("A log context needs at least one field.");
    }

    return await logContextStorage.run(context, work);
}
