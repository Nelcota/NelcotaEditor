import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { appSwitchStatesQueryOptions } from "#/modules/app-switches/model/app-switch-queries";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignUpClosedScreen } from "#/modules/auth/ui/screens/sign-up-closed-screen";
import { SignUpScreen } from "#/modules/auth/ui/screens/sign-up-screen";

export const Route = createFileRoute("/sign-up")({
    head: () => ({ meta: [{ title: "Criar conta · Nelcota" }] }),
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user !== null) {
            throw redirect({ to: "/overview" });
        }
    },
    loader: async ({ context }) => {
        const [captchaSiteKey, switches] = await Promise.all([
            getCaptchaSiteKey(),
            context.queryClient.fetchQuery({ ...appSwitchStatesQueryOptions(), staleTime: 0 }),
        ]);

        return {
            captchaSiteKey,
            isSignUpOpen: switches["sign-up"],
            isEmailVerificationRequired: switches["email-verification"],
        };
    },
    component: SignUpPage,
});

function SignUpPage(): ReactNode {
    const { captchaSiteKey, isSignUpOpen, isEmailVerificationRequired } = Route.useLoaderData();

    if (isSignUpOpen === false) {
        return <SignUpClosedScreen />;
    }

    return (
        <SignUpScreen
            captchaSiteKey={captchaSiteKey}
            isEmailVerificationRequired={isEmailVerificationRequired}
        />
    );
}
