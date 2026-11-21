/**
 * An Error the app or the server raised carries a message meant for the person. A failed request
 * in the browser does not: fetch rejects with a TypeError ("Failed to fetch"), in English and with
 * no way forward, so it gets the action's own fallback, which says what to do.
 */
export function toErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof TypeError) {
        return fallbackMessage;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}
