import { toAuthErrorMessage } from "#/modules/auth/auth-error-message";

interface AuthResult {
    error: { code?: string } | null;
}

/**
 * Runs a Better Auth client call and returns the message to show, or null when it worked.
 * Better Auth reports rejected requests in `error`, but a network failure throws instead.
 */
export async function runAuthRequest(request: () => Promise<AuthResult>): Promise<string | null> {
    try {
        const result = await request();
        const error = result.error;

        if (error === null) {
            return null;
        }

        return toAuthErrorMessage(error.code);
    } catch (error) {
        console.warn("Auth request failed", error);
        return toAuthErrorMessage(undefined);
    }
}
