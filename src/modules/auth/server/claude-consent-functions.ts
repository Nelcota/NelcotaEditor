import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { consentQueryInputSchema } from "#/modules/auth/model/claude-consent";
import type { ClaudeConsentRequest } from "#/modules/auth/model/claude-consent";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { readClaudeConsentRequest } from "#/modules/auth/server/claude-consent.server";

/** The consent page's data; only the signed-in person, from the query Better Auth signed. */
export const getClaudeConsentRequest = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(consentQueryInputSchema)
    .handler(async ({ data }): Promise<ClaudeConsentRequest | null> => {
        const request = getRequest();
        let query = data.query;

        // The router rewrites repeated parameters when it parses the address, which would break
        // the signature, so the first load reads the query exactly as the browser sent it.
        if (query.length === 0) {
            query = new URL(request.url).search;
        }

        return await readClaudeConsentRequest(query.replace(/^\?/u, ""), request.headers);
    });
