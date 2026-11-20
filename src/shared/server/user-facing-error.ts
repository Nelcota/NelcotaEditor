/**
 * An error whose message is safe to show to the end user (written in Portuguese).
 * Any other error is reported to the user as a generic failure, so internal details never leak.
 */
export class UserFacingError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "UserFacingError";
    }
}

const GENERIC_FAILURE_MESSAGE = "Algo deu errado. Tente novamente em instantes.";

export function toUserMessage(error: unknown): string {
    if (error instanceof UserFacingError) {
        return error.message;
    }

    return GENERIC_FAILURE_MESSAGE;
}
