import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { signInSearchSchema, toRedirectTarget } from "#/modules/auth/model/redirect-target";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignInScreen } from "#/modules/auth/ui/screens/sign-in-screen";

export const Route = createFileRoute("/sign-in")({
    head: () => ({ meta: [{ title: "Entrar · Nelcota" }] }),
    validateSearch: signInSearchSchema,
    beforeLoad: async ({ search }) => {
        const user = await getCurrentUser();

        // Already signed in: the same place a fresh sign-in would go.
        if (user !== null) {
            throw redirect({ href: toRedirectTarget(search) });
        }
    },
    loader: async () => ({ captchaSiteKey: await getCaptchaSiteKey() }),
    component: SignInPage,
});

function SignInPage(): ReactNode {
    const { captchaSiteKey } = Route.useLoaderData();
    const search = Route.useSearch();

    return (
        <SignInScreen captchaSiteKey={captchaSiteKey} redirectTarget={toRedirectTarget(search)} />
    );
}
