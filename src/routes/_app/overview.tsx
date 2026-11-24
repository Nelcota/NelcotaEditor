import { createFileRoute } from "@tanstack/react-router";
import {
    DEFAULT_OVERVIEW_PERIOD_DAYS,
    overviewSearchSchema,
} from "#/modules/overview/model/overview-period";
import { overviewQueryOptions } from "#/modules/overview/ui/hooks/overview-queries";
import { OverviewScreen } from "#/modules/overview/ui/screens/overview-screen";

export const Route = createFileRoute("/_app/overview")({
    head: () => ({ meta: [{ title: "Painel · Nelcota" }] }),
    validateSearch: overviewSearchSchema,
    loaderDeps: ({ search }) => ({ period: search.period }),
    loader: async ({ context, deps }): Promise<void> => {
        const periodDays = deps.period ?? DEFAULT_OVERVIEW_PERIOD_DAYS;

        await context.queryClient.prefetchQuery({
            ...overviewQueryOptions(periodDays),
            staleTime: "static",
        });
    },
    component: OverviewScreen,
});
