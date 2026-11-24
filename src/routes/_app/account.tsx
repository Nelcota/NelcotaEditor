import { createFileRoute } from "@tanstack/react-router";
import { preferencesQueryOptions } from "#/modules/preferences/ui/hooks/preferences-queries";
import { AccountScreen } from "#/modules/shell/ui/screens/account-screen";
import { usageQueryOptions } from "#/modules/videos/ui/hooks/library-queries";

export const Route = createFileRoute("/_app/account")({
    head: () => ({ meta: [{ title: "Conta · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        const queryClient = context.queryClient;

        await Promise.all([
            queryClient.prefetchQuery({ ...preferencesQueryOptions(), staleTime: "static" }),
            queryClient.prefetchQuery({ ...usageQueryOptions(), staleTime: "static" }),
        ]);
    },
    component: AccountScreen,
});
