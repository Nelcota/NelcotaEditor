import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getClaudeConsentRequest } from "#/modules/auth/server/claude-consent-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { ClaudeConsentScreen } from "#/modules/auth/ui/screens/claude-consent-screen";

/**
 * Better Auth sends the person here, signed in, when their Claude asks for access. The address is
 * the signed request; the server checks it before anything is shown.
 */
export const Route = createFileRoute("/oauth/consent")({
    head: () => ({ meta: [{ title: "Conectar o Claude · Editor Oculto" }] }),
    beforeLoad: async ({ location }) => {
        if ((await getCurrentUser()) === null) {
            throw redirect({ to: "/sign-in", search: { redirect: location.href } });
        }
    },
    // The raw query is the signed request, so it is read as written, not through validateSearch.
    loaderDeps: ({ search }) => search,
    // In the browser the raw query comes from window.location; on the server it is read from the
    // page request, since the router's parsed search would break the signature.
    loader: async () => ({
        request: await getClaudeConsentRequest({
            data: { query: globalThis.location?.search ?? "" },
        }),
    }),
    component: ClaudeConsentPage,
});

function ClaudeConsentPage(): ReactNode {
    const { request } = Route.useLoaderData();

    return <ClaudeConsentScreen request={request} />;
}
