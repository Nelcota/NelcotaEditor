import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supportTicketQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminTicketScreen } from "#/modules/admin/ui/screens/admin-ticket-screen";
import { loadTicket } from "#/modules/support/model/load-ticket";

export const Route = createFileRoute("/_app/admin/support/$ticketId")({
    head: ({ match }) => {
        // A missing ticket keeps the 404 page's title, which the root sets.
        if (match.status === "notFound") {
            return {};
        }

        return { meta: [{ title: "Ticket · Suporte · Admin · Editor Oculto" }] };
    },
    loader: async ({ context, params }): Promise<void> => {
        const ticketId = params.ticketId;
        const queryClient = context.queryClient;

        await loadTicket(ticketId, () =>
            queryClient.ensureQueryData(supportTicketQueryOptions(ticketId)),
        );
    },
    component: AdminTicketRoute,
});

function AdminTicketRoute(): ReactNode {
    const params = Route.useParams();

    return <AdminTicketScreen key={params.ticketId} ticketId={params.ticketId} />;
}
