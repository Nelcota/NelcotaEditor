import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    DEFAULT_OVERVIEW_PERIOD_DAYS,
    overviewSearchSchema,
} from "#/modules/overview/model/overview-period";
import { overviewQueryOptions } from "#/modules/overview/model/overview-queries";
import { OverviewScreen } from "#/modules/overview/ui/screens/overview-screen";
import { FirstVideoEmptyState } from "#/modules/videos/ui/components/video-list-states";

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
    component: OverviewRoute,
});

function OverviewRoute(): ReactNode {
    return <OverviewScreen firstVideoEmptyState={<FirstVideoEmptyState />} />;
}
