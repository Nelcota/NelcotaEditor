/** A thrown Error carries a message meant for the person; anything else gets the fallback. */
export function toErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}
