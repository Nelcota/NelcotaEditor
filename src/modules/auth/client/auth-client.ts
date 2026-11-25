import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * oauthProviderClient carries a signed OAuth request (Claude connecting) through sign-in and
 * consent, and follows the provider's redirect to the next step.
 */
export const authClient = createAuthClient({ plugins: [adminClient(), oauthProviderClient()] });
