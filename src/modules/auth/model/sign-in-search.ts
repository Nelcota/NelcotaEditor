import { z } from "zod";
import { isAppPath } from "#/modules/auth/model/redirect-target";

/**
 * The sign-in page's search params. Better Auth adds `error` when an email confirmation link
 * fails, the reset screen adds `reset` after a new password is saved, and a protected page adds
 * `redirect` to come back to after signing in. A bad value is dropped instead of failing the page.
 */
export const signInSearchSchema = z.object({
    error: z.string().max(64).optional().catch(undefined),
    reset: z.literal("done").optional().catch(undefined),
    redirect: z.string().refine(isAppPath).optional().catch(undefined),
});

export type SignInSearch = z.infer<typeof signInSearchSchema>;

// The address a person just signed up with rides in the history entry, never in the URL, so the
// sign-in form can start filled in without the email reaching logs or the address bar.
declare module "@tanstack/react-router" {
    interface HistoryState {
        signInEmail?: string;
    }
}
