import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { SignUpScreen } from "#/modules/auth/ui/sign-up-screen";

export const Route = createFileRoute("/sign-up")({
    head: () => ({ meta: [{ title: "Criar conta · Nelcota" }] }),
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user !== null) {
            throw redirect({ to: "/overview" });
        }
    },
    component: SignUpScreen,
});
