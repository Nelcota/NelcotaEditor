import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AccountSwitchError } from "#/modules/auth/model/account-switch-error";

type AuthRequest = () => Promise<{
    error: { code?: string; status?: number } | null;
}>;

/**
 * Switching accounts swaps the session cookie, so the page reloads at its destination: every cached
 * query belongs to the account that was signed in before.
 *
 * @throws {AccountSwitchError} When Better Auth refuses the switch.
 */
async function switchAccount(request: AuthRequest, destination: string): Promise<void> {
    const failure = await runAuthRequest(request);

    if (failure !== null) {
        throw new AccountSwitchError(failure);
    }

    window.location.assign(destination);
}

/** An admin signs in as this account for support; the banner on every page leads back. */
export async function startImpersonation(userId: string): Promise<void> {
    await switchAccount(() => authClient.admin.impersonateUser({ userId }), "/");
}

export async function stopImpersonation(): Promise<void> {
    await switchAccount(() => authClient.admin.stopImpersonating(), "/admin/users");
}
