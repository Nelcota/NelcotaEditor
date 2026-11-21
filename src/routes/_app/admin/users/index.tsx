import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { adminUsersSearchSchema } from "#/modules/admin/admin-search";
import type { AdminUsersSearch } from "#/modules/admin/admin-search";
import { AdminUsersScreen } from "#/modules/admin/ui/admin-users-screen";

export const Route = createFileRoute("/_app/admin/users/")({
    validateSearch: adminUsersSearchSchema,
    head: () => ({ meta: [{ title: "Usuários · Admin · Nelcota" }] }),
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
