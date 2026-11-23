import { createFileRoute } from "@tanstack/react-router";
import { preferencesQueryOptions } from "#/modules/preferences/ui/preferences-queries";
import { AccountScreen } from "#/modules/shell/ui/account-screen";
import { usageQueryOptions } from "#/modules/videos/ui/library-queries";

export const Route = createFileRoute("/_app/account")({
    head: () => ({ meta: [{ title: "Conta · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        const queryClient = context.queryClient;

        await Promise.all([
            queryClient.prefetchQuery(preferencesQueryOptions()),
            queryClient.prefetchQuery(usageQueryOptions()),
        ]);
    },
    component: AccountScreen,
});
