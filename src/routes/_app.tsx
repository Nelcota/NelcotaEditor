import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";
import { AppLayout } from "#/modules/auth/ui/app-layout";

export const Route = createFileRoute("/_app")({
    beforeLoad: async () => {
        const user = await getCurrentUser();

        if (user === null) {
            throw redirect({ to: "/sign-in" });
        }

        return { user };
    },
    component: AppLayout,
});
