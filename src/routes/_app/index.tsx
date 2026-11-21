import { createFileRoute } from "@tanstack/react-router";
import { dashboardSearchSchema } from "#/modules/videos/ui/dashboard-search";
import { DashboardScreen } from "#/modules/videos/ui/dashboard-screen";

export const Route = createFileRoute("/_app/")({
    head: () => ({ meta: [{ title: "Vídeos · Nelcota" }] }),
    validateSearch: dashboardSearchSchema,
    component: DashboardScreen,
});
