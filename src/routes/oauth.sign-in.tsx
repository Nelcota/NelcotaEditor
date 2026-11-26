import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { SignInScreen } from "#/modules/auth/ui/screens/sign-in-screen";

const NO_NOTICE = {};

/**
 * Where Better Auth sends a person's Claude when nobody is signed in. The address carries the
 * signed authorization request; the auth client sends it with the sign-in, and Better Auth goes on
 * to the consent page.
 */
export const Route = createFileRoute("/oauth/sign-in")({
    head: () => ({ meta: [{ title: "Conectar o Claude · Editor Oculto" }] }),
    loader: async () => ({ captchaSiteKey: await getCaptchaSiteKey() }),
    component: ClaudeSignInPage,
});

function ClaudeSignInPage(): ReactNode {
    const { captchaSiteKey } = Route.useLoaderData();

    return (
        <SignInScreen
            captchaSiteKey={captchaSiteKey}
            search={NO_NOTICE}
            redirectTarget="/claude"
            isAuthorizingApp
        />
    );
}
