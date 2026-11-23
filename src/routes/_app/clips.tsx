import { createFileRoute } from "@tanstack/react-router";
import { libraryClipsQueryOptions } from "#/modules/videos/ui/library-queries";
import { ClipsScreen } from "#/modules/videos/ui/clips-screen";

export const Route = createFileRoute("/_app/clips")({
    head: () => ({ meta: [{ title: "Cortes · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchQuery(libraryClipsQueryOptions());
    },
    component: ClipsScreen,
});
