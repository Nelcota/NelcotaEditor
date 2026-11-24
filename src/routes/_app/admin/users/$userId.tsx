import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DEFAULT_ADMIN_VIDEO_FILTER } from "#/modules/admin/model/admin-search";
import { adminVideosQueryOptions } from "#/modules/admin/model/admin-queries";
import { loadAdminUser } from "#/modules/admin/model/load-admin-user";
import { AdminUserScreen } from "#/modules/admin/ui/screens/admin-user-screen";

export const Route = createFileRoute("/_app/admin/users/$userId")({
    head: ({ match }) => {
        // A missing account keeps the 404 page's title, which the root sets.
        if (match.status === "notFound") {
            return {};
        }

        return { meta: [{ title: "Conta · Admin · Nelcota" }] };
    },
    // The account and the first page of its videos, as the screen asks for them.
    loader: async ({ context, params }): Promise<void> => {
        const queryClient = context.queryClient;
        const userId = params.userId;
        const firstVideosPage = adminVideosQueryOptions({
            query: "",
            page: 1,
            filter: DEFAULT_ADMIN_VIDEO_FILTER,
            ownerId: userId,
        });

        await Promise.all([
            loadAdminUser(queryClient, userId),
            queryClient.prefetchQuery({ ...firstVideosPage, staleTime: "static" }),
        ]);
    },
    component: AdminUserRoute,
});

function AdminUserRoute(): ReactNode {
    const params = Route.useParams();

    return <AdminUserScreen key={params.userId} userId={params.userId} />;
}
