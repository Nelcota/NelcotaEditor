import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supportQueueQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminSupportScreen } from "#/modules/admin/ui/screens/admin-support-screen";
import {
    DEFAULT_STAFF_TICKET_FILTER,
    adminSupportSearchSchema,
} from "#/modules/support/model/staff-ticket-filter";
import type { StaffTicketFilter } from "#/modules/support/model/staff-ticket-filter";

export const Route = createFileRoute("/_app/admin/support")({
    validateSearch: adminSupportSearchSchema,
    head: () => ({ meta: [{ title: "Suporte · Admin · Nelcota" }] }),
    loaderDeps: ({ search }) => ({ filter: search.filter ?? DEFAULT_STAFF_TICKET_FILTER }),
    loader: async ({ context, deps }): Promise<void> => {
        await context.queryClient.prefetchInfiniteQuery({
            ...supportQueueQueryOptions(deps.filter),
            staleTime: "static",
        });
    },
    component: AdminSupportRoute,
});

function AdminSupportRoute(): ReactNode {
    const search = Route.useSearch();
    const navigate = useNavigate();
    const changeFilter = async (filter: StaffTicketFilter): Promise<void> => {
        await navigate({ to: "/admin/support", search: { filter }, replace: true });
    };

    return (
        <AdminSupportScreen
            filter={search.filter ?? DEFAULT_STAFF_TICKET_FILTER}
            onFilterChange={changeFilter}
        />
    );
}
