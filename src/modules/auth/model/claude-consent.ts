import { z } from "zod";

/** A signed authorize query is a few hundred characters; this bounds what the server reads. */
const MAX_CONSENT_QUERY_LENGTH = 4000;

/**
 * The page's raw query from the browser, or "" when the server reads it from the page request
 * (the first load, which is how Better Auth sends the person here).
 */
export const consentQueryInputSchema = z.object({
    query: z.string().trim().max(MAX_CONSENT_QUERY_LENGTH),
});

/** What the consent page shows; every field the client chose is its own claim, not a fact. */
export interface ClaudeConsentRequest {
    /** The name the client registered with; null when it gave none. */
    clientName: string | null;
    /** Where the answer goes, so the person sees it is the app they expect (claude.ai). */
    redirectHost: string;
    scopes: Array<string>;
}

/** "https://claude.ai/api/mcp/auth_callback" → "claude.ai"; a custom scheme stays whole. */
export function toRedirectLabel(redirectUri: string): string {
    if (redirectUri.trim().length === 0) {
        throw new Error("A consent request needs its redirect URI");
    }

    const url = URL.parse(redirectUri);

    if (url === null || url.host.length === 0) {
        return redirectUri;
    }

    return url.host;
}
