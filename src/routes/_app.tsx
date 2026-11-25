import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/components/account-menu-button";
import { ImpersonationBanner } from "#/modules/auth/ui/components/impersonation-banner";
import { MascotAnimationScope } from "#/modules/shell/ui/components/mascot-animation-scope";
import { AppLayout } from "#/modules/shell/ui/screens/app-layout";
import { currentUserQueryOptions } from "#/modules/auth/model/current-user-query";
import { preferencesQueryOptions } from "#/modules/preferences/model/preferences-queries";
import { usageQueryOptions } from "#/modules/videos/model/library-queries";
import {
    videoCountsQueryOptions,
    workingVideosQueryOptions,
} from "#/modules/videos/model/video-queries";
import { VideoProgressWatcher } from "#/modules/videos/ui/components/video-progress-watcher";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context, location }) => {
        const user = await context.queryClient.fetchQuery(currentUserQueryOptions());

        // The page asked for comes back after signing in; href is relative (path, search, hash).
        if (user === null) {
            throw redirect({ to: "/sign-in", search: { redirect: location.href } });
        }

        return { user };
    },
    // The sidebar (counts, bell, storage card), the Vídeos list and the Início link box (which sends
    // with the saved preferences) read these; loading it with the page
    // keeps them from opening empty. In every route loader, prefetch never throws (a failure is left
    // to the screen's own error state), and "static" hands back cached data at once: the screen's
    // query refreshes it in the background, so returning to a page never waits on the network.
    loader: async ({ context }): Promise<void> => {
        await Promise.all([
            context.queryClient.prefetchQuery({
                ...videoCountsQueryOptions(),
                staleTime: "static",
            }),
            context.queryClient.prefetchQuery({
                ...workingVideosQueryOptions(),
                staleTime: "static",
            }),
            context.queryClient.prefetchQuery({ ...usageQueryOptions(), staleTime: "static" }),
            context.queryClient.prefetchQuery({
                ...preferencesQueryOptions(),
                staleTime: "static",
            }),
        ]);
    },
    component: AppLayoutRoute,
});

function AppLayoutRoute(): ReactNode {
    return (
        <MascotAnimationScope>
            <AppLayout
                accountMenu={<AccountMenuButton />}
                impersonationBanner={<ImpersonationBanner />}
                videoProgressWatcher={<VideoProgressWatcher />}
            />
        </MascotAnimationScope>
    );
}
