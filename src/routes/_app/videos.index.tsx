import { createFileRoute } from "@tanstack/react-router";
import { dashboardSearchSchema } from "#/modules/videos/model/dashboard-search";
import { DashboardScreen } from "#/modules/videos/ui/screens/dashboard-screen";

export const Route = createFileRoute("/_app/videos/")({
    head: () => ({ meta: [{ title: "Vídeos · Editor Oculto" }] }),
    validateSearch: dashboardSearchSchema,
    component: DashboardScreen,
});
