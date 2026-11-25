import { createFileRoute } from "@tanstack/react-router";
import { AdminTicketPlaceholder } from "#/modules/admin/ui/components/admin-ticket-placeholder";

export const Route = createFileRoute("/_app/admin/support/")({
    component: AdminTicketPlaceholder,
});
