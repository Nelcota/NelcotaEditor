import { createFileRoute } from "@tanstack/react-router";
import { adminAppSwitchesQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminAppSwitchesScreen } from "#/modules/admin/ui/screens/admin-app-switches-screen";

export const Route = createFileRoute("/_app/admin/features")({
    head: () => ({ meta: [{ title: "Recursos · Admin · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchQuery({
            ...adminAppSwitchesQueryOptions(),
            staleTime: "static",
        });
    },
    component: AdminAppSwitchesScreen,
});
