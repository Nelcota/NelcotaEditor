import { createFileRoute, redirect } from "@tanstack/react-router";
import { appSwitchStatesQueryOptions } from "#/modules/app-switches/model/app-switch-queries";
import { MaintenanceScreen } from "#/modules/app-switches/ui/screens/maintenance-screen";

export const Route = createFileRoute("/maintenance")({
    head: () => ({ meta: [{ title: "Em manutenção · Nelcota" }] }),
    beforeLoad: async ({ context }) => {
        const switches = await context.queryClient.fetchQuery({
            ...appSwitchStatesQueryOptions(),
            staleTime: 0,
        });

        if (switches["maintenance-mode"] === false) {
            throw redirect({ to: "/" });
        }
    },
    component: MaintenanceScreen,
});
