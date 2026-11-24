import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { signInSearchSchema } from "#/modules/auth/model/sign-in-notice";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignInScreen } from "#/modules/auth/ui/screens/sign-in-screen";

export const Route = createFileRoute("/sign-in")({
    head: () => ({ meta: [{ title: "Entrar · Nelcota" }] }),
    validateSearch: signInSearchSchema,
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user !== null) {
            throw redirect({ to: "/overview" });
        }
    },
    loader: async () => ({ captchaSiteKey: await getCaptchaSiteKey() }),
    component: SignInPage,
});

function SignInPage(): ReactNode {
    const { captchaSiteKey } = Route.useLoaderData();
    const search = Route.useSearch();

    return <SignInScreen captchaSiteKey={captchaSiteKey} search={search} />;
}
