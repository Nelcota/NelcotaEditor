import { createFileRoute } from "@tanstack/react-router";
import { libraryClipsQueryOptions } from "#/modules/videos/model/library-queries";
import { ClipsScreen } from "#/modules/videos/ui/screens/clips-screen";

export const Route = createFileRoute("/_app/clips")({
    head: () => ({ meta: [{ title: "Cortes · Nelcota" }] }),
    loader: async ({ context }): Promise<void> => {
        await context.queryClient.prefetchQuery({
            ...libraryClipsQueryOptions(),
            staleTime: "static",
        });
    },
    component: ClipsScreen,
});
