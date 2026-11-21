import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { adminVideosSearchSchema } from "#/modules/admin/admin-search";
import type { AdminVideosSearch } from "#/modules/admin/admin-search";
import { AdminVideosScreen } from "#/modules/admin/ui/admin-videos-screen";

export const Route = createFileRoute("/_app/admin/videos")({
    validateSearch: adminVideosSearchSchema,
    head: () => ({ meta: [{ title: "Vídeos · Admin · Nelcota" }] }),
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
