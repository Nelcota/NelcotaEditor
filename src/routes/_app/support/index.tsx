import { createFileRoute } from "@tanstack/react-router";
import { myTicketsQueryOptions } from "#/modules/support/model/support-queries";
import { SupportScreen } from "#/modules/support/ui/screens/support-screen";

export const Route = createFileRoute("/_app/support/")({
    head: () => ({ meta: [{ title: "Suporte · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchInfiniteQuery({
            ...myTicketsQueryOptions(),
            staleTime: "static",
        });
    },
    component: SupportScreen,
});
