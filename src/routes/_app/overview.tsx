import { createFileRoute } from "@tanstack/react-router";
import { overviewSearchSchema } from "#/modules/overview/overview-period";
import { OverviewScreen } from "#/modules/overview/ui/overview-screen";

export const Route = createFileRoute("/_app/overview")({
    head: () => ({ meta: [{ title: "Painel · Nelcota" }] }),
    validateSearch: overviewSearchSchema,
    component: OverviewScreen,
});
