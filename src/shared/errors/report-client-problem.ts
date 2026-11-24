/**
 * A failure the browser handled (the person already sees what happened) that is still worth a
 * look. `reportError` hands it to the page's error handlers: the console in development and the
 * error tracker once it listens.
 */
export function reportClientProblem(message: string, cause: unknown): void {
    if (message.trim().length === 0) {
        throw new RangeError("A reported problem needs a message.");
    }

    reportError(new Error(message, { cause }));
}
