import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DEFAULT_ADMIN_VIDEO_FILTER, adminVideosSearchSchema } from "#/modules/admin/admin-search";
import type { AdminVideosSearch } from "#/modules/admin/admin-search";
import { adminVideosQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminVideosScreen } from "#/modules/admin/ui/admin-videos-screen";

export const Route = createFileRoute("/_app/admin/videos")({
    validateSearch: adminVideosSearchSchema,
    head: () => ({ meta: [{ title: "Vídeos · Admin · Nelcota" }] }),
    loaderDeps: ({ search }) => ({ q: search.q, page: search.page, filter: search.filter }),
    // The same input the screen asks for, so the screen finds this result in the cache.
    loader: async ({ context, deps }): Promise<void> => {
        const options = adminVideosQueryOptions({
            query: deps.q ?? "",
            page: deps.page ?? 1,
            filter: deps.filter ?? DEFAULT_ADMIN_VIDEO_FILTER,
            ownerId: null,
        });

        await context.queryClient.prefetchQuery(options);
    },
    component: AdminVideosRoute,
});

function AdminVideosRoute(): ReactNode {
    const search = Route.useSearch();
    const navigate = useNavigate();
    const changeSearch = async (next: AdminVideosSearch): Promise<void> => {
        await navigate({ to: "/admin/videos", search: next, replace: true });
    };

    return <AdminVideosScreen search={search} onSearchChange={changeSearch} />;
}
