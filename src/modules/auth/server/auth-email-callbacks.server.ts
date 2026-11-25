import type { User } from "better-auth";
import { pickGreetingName } from "#/modules/auth/server/auth-email-content.server";
import { enqueueAuthEmail } from "#/modules/auth/server/auth-email-queue.server";
import { getEnvironment, InvalidEnvironmentError } from "#/shared/server/env.server";

/** Where the "someone used your email" message sends the owner. */
const FORGOT_PASSWORD_PATH = "/forgot-password";

interface EmailLink {
    user: User;
    url: string;
}

export async function queueVerificationEmail({ user, url }: EmailLink): Promise<void> {
    await enqueueAuthEmail({ kind: "verify-email", to: user.email, name: null, url });
}

export async function queueResetPasswordEmail({ user, url }: EmailLink): Promise<void> {
    await enqueueAuthEmail({
        kind: "reset-password",
        to: user.email,
        name: pickGreetingName(user),
        url,
    });
}

/**
 * Sign-up answers the same for a taken email, so nobody learns which addresses have accounts;
 * the owner hears about the attempt here instead.
 */
export async function queueExistingAccountEmail({ user }: { user: User }): Promise<void> {
    const authUrl = getEnvironment().BETTER_AUTH_URL;

    if (authUrl === undefined) {
        throw new InvalidEnvironmentError(["BETTER_AUTH_URL"]);
    }

    const url = new URL(FORGOT_PASSWORD_PATH, authUrl).toString();
    await enqueueAuthEmail({
        kind: "existing-account",
        to: user.email,
        name: pickGreetingName(user),
        url,
    });
}
