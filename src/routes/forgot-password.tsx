import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { ForgotPasswordScreen } from "#/modules/auth/ui/screens/forgot-password-screen";

export const Route = createFileRoute("/forgot-password")({
    head: () => ({ meta: [{ title: "Recuperar senha · Nelcota" }] }),
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user !== null) {
            throw redirect({ to: "/overview" });
        }
    },
    loader: async () => ({ captchaSiteKey: await getCaptchaSiteKey() }),
    component: ForgotPasswordPage,
});

function ForgotPasswordPage(): ReactNode {
    const { captchaSiteKey } = Route.useLoaderData();

    return <ForgotPasswordScreen captchaSiteKey={captchaSiteKey} />;
}
