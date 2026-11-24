import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignUpScreen } from "#/modules/auth/ui/screens/sign-up-screen";

export const Route = createFileRoute("/sign-up")({
    head: () => ({ meta: [{ title: "Criar conta · Nelcota" }] }),
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user !== null) {
            throw redirect({ to: "/overview" });
        }
    },
    loader: async () => ({ captchaSiteKey: await getCaptchaSiteKey() }),
    component: SignUpPage,
});

function SignUpPage(): ReactNode {
    const { captchaSiteKey } = Route.useLoaderData();

    return <SignUpScreen captchaSiteKey={captchaSiteKey} />;
}
