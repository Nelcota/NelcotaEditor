import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "#/modules/shell/ui/app-layout";
import { currentUserQueryOptions } from "#/modules/auth/ui/current-user-query";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery(currentUserQueryOptions());

        if (user === null) {
            throw redirect({ to: "/sign-in" });
        }

        return { user };
    },
    // The sidebar, the open tabs and the Vídeos list all read this list; loading it with the page
    // keeps them from opening empty. In every route loader, prefetch never throws (a failure is left
    // to the screen's own error state), and "static" hands back cached data at once: the screen's
    // query refreshes it in the background, so returning to a page never waits on the network.
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchQuery({ ...videosQueryOptions(), staleTime: "static" });
    },
    component: AppLayout,
});
