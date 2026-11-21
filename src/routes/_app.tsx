import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "#/modules/shell/ui/app-layout";
import { currentUserQueryOptions } from "#/modules/auth/ui/current-user-query";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery(currentUserQueryOptions());

        if (user === null) {
            throw redirect({ to: "/sign-in" });
        }

        return { user };
    },
    component: AppLayout,
});
