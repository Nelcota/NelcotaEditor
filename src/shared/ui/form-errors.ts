function readMessage(error: unknown): string | null {
    if (typeof error === "string") {
        return error;
    }

    if (typeof error !== "object" || error === null || "message" in error === false) {
        return null;
    }

    const message = error.message;

    if (typeof message !== "string") {
        return null;
    }

    return message;
}

/** TanStack Form keeps validator issues as unknown values; this turns them into text. */
export function toErrorMessages(errors: ReadonlyArray<unknown>): Array<string> {
    const messages = errors.map(readMessage).filter((message) => message !== null);
    return [...new Set(messages)];
}
