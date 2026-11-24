import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "#/modules/shell/ui/app-layout";
import { currentUserQueryOptions } from "#/modules/auth/ui/current-user-query";
import { preferencesQueryOptions } from "#/modules/preferences/ui/preferences-queries";
import { usageQueryOptions } from "#/modules/videos/ui/library-queries";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery(currentUserQueryOptions());

        if (user === null) {
            throw redirect({ to: "/sign-in" });
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
            context.queryClient.prefetchQuery({ ...videosQueryOptions(), staleTime: "static" }),
            context.queryClient.prefetchQuery({ ...usageQueryOptions(), staleTime: "static" }),
            context.queryClient.prefetchQuery({
                ...preferencesQueryOptions(),
                staleTime: "static",
            }),
        ]);
    },
    component: AppLayout,
});
