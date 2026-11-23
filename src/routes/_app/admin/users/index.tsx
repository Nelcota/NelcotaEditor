import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { adminUsersSearchSchema } from "#/modules/admin/admin-search";
import type { AdminUsersSearch } from "#/modules/admin/admin-search";
import { adminUsersQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminUsersScreen } from "#/modules/admin/ui/admin-users-screen";

export const Route = createFileRoute("/_app/admin/users/")({
    validateSearch: adminUsersSearchSchema,
    head: () => ({ meta: [{ title: "Usuários · Admin · Nelcota" }] }),
    loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
    // The same input the screen asks for, so the screen finds this result in the cache.
    loader: async ({ context, deps }): Promise<void> => {
        const options = adminUsersQueryOptions({ query: deps.q ?? "", page: deps.page ?? 1 });

        await context.queryClient.prefetchQuery({ ...options, staleTime: "static" });
    },
    component: AdminUsersRoute,
});

function AdminUsersRoute(): ReactNode {
    const search = Route.useSearch();
    const navigate = useNavigate();
    const changeSearch = async (next: AdminUsersSearch): Promise<void> => {
        await navigate({ to: "/admin/users", search: next, replace: true });
    };

    return <AdminUsersScreen search={search} onSearchChange={changeSearch} />;
}
