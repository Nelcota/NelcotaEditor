import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DEFAULT_CLIP_ORDER } from "#/modules/videos/model/clip-order";
import { clipsSearchSchema } from "#/modules/videos/model/clips-search";
import type { ClipsSearch } from "#/modules/videos/model/clips-search";
import { libraryClipsQueryOptions } from "#/modules/videos/model/library-queries";
import { ClipsScreen } from "#/modules/videos/ui/screens/clips-screen";

export const Route = createFileRoute("/_app/clips")({
    head: () => ({ meta: [{ title: "Meus cortes · Editor Oculto" }] }),
    validateSearch: clipsSearchSchema,
    loaderDeps: ({ search }) => ({ q: search.q, order: search.order }),
    // The same request the screen makes, so the screen finds the first page in the cache.
    loader: async ({ context, deps }): Promise<void> => {
        const options = libraryClipsQueryOptions({
            query: deps.q ?? "",
            order: deps.order ?? DEFAULT_CLIP_ORDER,
        });

        await context.queryClient.prefetchInfiniteQuery({ ...options, staleTime: "static" });
    },
    component: ClipsRoute,
});

function ClipsRoute(): ReactNode {
    const search = Route.useSearch();
    const navigate = useNavigate();
    const changeSearch = async (next: ClipsSearch): Promise<void> => {
        await navigate({ to: "/clips", search: next, replace: true });
    };

    return <ClipsScreen search={search} onSearchChange={changeSearch} />;
}
