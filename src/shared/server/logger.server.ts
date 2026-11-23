import { toLoggableError } from "#/shared/server/loggable-error.server";

type LogLevel = "info" | "warn" | "error";

/** Ids, counts, durations and route names only: never titles, links, e-mails or tokens. */
export type LogContext = Readonly<Record<string, unknown>>;

/**
 * One JSON object per line, so a log aggregator can filter by level, videoId or route.
 * Errors at the top level of the context go through toLoggableError.
 */
export function formatLogLine(level: LogLevel, message: string, context: LogContext): string {
    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
        fields[key] = toLoggableValue(key, value);
    }

    return JSON.stringify({ ...fields, time: new Date().toISOString(), level, message });
}

/** A caught value is `unknown`, so the `error` key is sanitized even when it is not an Error. */
function toLoggableValue(key: string, value: unknown): unknown {
    if (key === "error" || value instanceof Error) {
        return toLoggableError(value);
    }

    return value;
}

function writeLine(level: LogLevel, message: string, context: LogContext): void {
    const line = `${formatLogLine(level, message, context)}\n`;

    if (level === "info") {
        process.stdout.write(line);
        return;
    }

    process.stderr.write(line);
}

export const logger = {
    info: (message: string, context: LogContext = {}): void => writeLine("info", message, context),
    warn: (message: string, context: LogContext = {}): void => writeLine("warn", message, context),
    error: (message: string, context: LogContext = {}): void =>
        writeLine("error", message, context),
};
