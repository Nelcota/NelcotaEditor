import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AdminUserScreen } from "#/modules/admin/ui/admin-user-screen";

export const Route = createFileRoute("/_app/admin/users/$userId")({
    head: () => ({ meta: [{ title: "Conta · Admin · Nelcota" }] }),
    component: AdminUserRoute,
});

function AdminUserRoute(): ReactNode {
    const params = Route.useParams();

    return <AdminUserScreen key={params.userId} userId={params.userId} />;
}
