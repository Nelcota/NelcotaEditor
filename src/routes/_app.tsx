import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/components/account-menu-button";
import { ImpersonationBanner } from "#/modules/auth/ui/components/impersonation-banner";
import { AppLayout } from "#/modules/shell/ui/screens/app-layout";
import { currentUserQueryOptions } from "#/modules/auth/model/current-user-query";
import { usageQueryOptions } from "#/modules/videos/model/library-queries";
import { videosQueryOptions } from "#/modules/videos/model/video-queries";
import { VideoProgressWatcher } from "#/modules/videos/ui/components/video-progress-watcher";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery(currentUserQueryOptions());

        if (user === null) {
            throw redirect({ to: "/sign-in" });
        }

        return { user };
    },
    // The sidebar (counts, bell, storage card) and the Vídeos list read these; loading it with the page
    // keeps them from opening empty. In every route loader, prefetch never throws (a failure is left
    // to the screen's own error state), and "static" hands back cached data at once: the screen's
    // query refreshes it in the background, so returning to a page never waits on the network.
    loader: async ({ context }): Promise<void> => {
        await Promise.all([
            context.queryClient.prefetchQuery({ ...videosQueryOptions(), staleTime: "static" }),
            context.queryClient.prefetchQuery({ ...usageQueryOptions(), staleTime: "static" }),
        ]);
    },
    component: AppLayoutRoute,
});

function AppLayoutRoute(): ReactNode {
    return (
        <AppLayout
            accountMenu={<AccountMenuButton />}
            impersonationBanner={<ImpersonationBanner />}
            videoProgressWatcher={<VideoProgressWatcher />}
        />
    );
}
