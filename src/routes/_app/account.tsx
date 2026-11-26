import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DeleteAccountRow } from "#/modules/auth/ui/components/delete-account-row";
import { ProfileRows } from "#/modules/auth/ui/components/profile-rows";
import { PreferencesSection } from "#/modules/preferences/ui/components/preferences-section";
import { UsageRows } from "#/modules/videos/ui/components/usage-rows";
import { preferencesQueryOptions } from "#/modules/preferences/model/preferences-queries";
import { AccountScreen } from "#/modules/shell/ui/screens/account-screen";
import { usageQueryOptions } from "#/modules/videos/model/library-queries";

export const Route = createFileRoute("/_app/account")({
    head: () => ({ meta: [{ title: "Conta · Editor Oculto" }] }),
    loader: async ({ context }): Promise<void> => {
        const queryClient = context.queryClient;

        await Promise.all([
            queryClient.prefetchQuery({ ...preferencesQueryOptions(), staleTime: "static" }),
            queryClient.prefetchQuery({ ...usageQueryOptions(), staleTime: "static" }),
        ]);
    },
    component: AccountRoute,
});

function AccountRoute(): ReactNode {
    return (
        <AccountScreen
            profileRows={<ProfileRows />}
            preferencesSection={<PreferencesSection />}
            usageRows={<UsageRows />}
            deleteAccountRow={<DeleteAccountRow />}
        />
    );
}
