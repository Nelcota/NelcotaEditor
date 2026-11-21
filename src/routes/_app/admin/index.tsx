import { createFileRoute } from "@tanstack/react-router";
import { AdminOverviewScreen } from "#/modules/admin/ui/admin-overview-screen";

export const Route = createFileRoute("/_app/admin/")({
    component: AdminOverviewScreen,
});
