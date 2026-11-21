import { useState } from "react";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";

interface Impersonation {
    run: () => Promise<void>;
    isRunning: boolean;
    errorMessage: string | null;
}

/**
 * Switching accounts swaps the session cookie, so the page reloads at its destination: every cached
 * query belongs to the account that was signed in before.
 */
function useAccountSwitch(
    request: () => Promise<{ error: { code?: string; status?: number } | null }>,
    destination: string,
): Impersonation {
    const [isRunning, setIsRunning] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const run = async (): Promise<void> => {
        setIsRunning(true);
        setErrorMessage(null);
        const failure = await runAuthRequest(request);

        if (failure !== null) {
            setErrorMessage(failure);
            setIsRunning(false);
            return;
        }

        window.location.assign(destination);
    };

    return { run, isRunning, errorMessage };
}

/** An admin signs in as this account for support; the banner on every page leads back. */
export function useStartImpersonation(userId: string): Impersonation {
    return useAccountSwitch(() => authClient.admin.impersonateUser({ userId }), "/");
}

export function useStopImpersonation(): Impersonation {
    return useAccountSwitch(() => authClient.admin.stopImpersonating(), "/admin/users");
}
