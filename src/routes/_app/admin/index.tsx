import { createFileRoute } from "@tanstack/react-router";
import { adminOverviewQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminOverviewScreen } from "#/modules/admin/ui/screens/admin-overview-screen";

export const Route = createFileRoute("/_app/admin/")({
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchQuery({
            ...adminOverviewQueryOptions(),
            staleTime: "static",
        });
    },
    component: AdminOverviewScreen,
});
