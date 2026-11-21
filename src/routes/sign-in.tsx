import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignInScreen } from "#/modules/auth/ui/sign-in-screen";

export const Route = createFileRoute("/sign-in")({
    head: () => ({ meta: [{ title: "Entrar · Nelcota" }] }),
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

    return <SignInScreen captchaSiteKey={captchaSiteKey} />;
}
