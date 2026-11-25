import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import { z } from "zod";
import { toRedirectLabel } from "#/modules/auth/model/claude-consent";
import type { ClaudeConsentRequest } from "#/modules/auth/model/claude-consent";
import { auth } from "#/modules/auth/server/auth.server";

/** The parameters the provider signs, as its docs list them; the page's own ones break nothing. */
const SIGNATURE_PARAM = "sig";
const SIGNED_NAMES_PARAM = "ba_param";

const publicClientSchema = z.object({ client_name: z.string().nullish() });

/** Keeps only the signed parameters, so the signature check covers exactly what was signed. */
function toSignedQuery(query: string): URLSearchParams {
    const params = new URLSearchParams(query);
    const signedNames = new Set([
        SIGNATURE_PARAM,
        SIGNED_NAMES_PARAM,
        ...params.getAll(SIGNED_NAMES_PARAM),
    ]);

    return new URLSearchParams([...params].filter(([name]) => signedNames.has(name)));
}

/**
 * The consent page's request, read from the signed query Better Auth sent the person with. A
 * changed or expired query is null: the page then asks the person to start again from Claude.
 */
export async function readClaudeConsentRequest(
    query: string,
    headers: Headers,
): Promise<ClaudeConsentRequest | null> {
    const signed = toSignedQuery(query);
    const { secret } = await auth.$context;

    if ((await verifyOAuthQueryParams(signed.toString(), secret)) === false) {
        return null;
    }

    const clientId = signed.get("client_id");
    const redirectUri = signed.get("redirect_uri");

    if (clientId === null || redirectUri === null) {
        return null;
    }

    const client = publicClientSchema.parse(
        await auth.api.getOAuthClientPublic({ query: { client_id: clientId }, headers }),
    );

    return {
        clientName: client.client_name ?? null,
        redirectHost: toRedirectLabel(redirectUri),
        scopes: (signed.get("scope") ?? "").split(" ").filter((scope) => scope.length > 0),
    };
}
