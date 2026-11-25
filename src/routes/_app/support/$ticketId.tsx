import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { loadTicket } from "#/modules/support/model/load-ticket";
import { myTicketQueryOptions } from "#/modules/support/model/support-queries";
import { TicketScreen } from "#/modules/support/ui/screens/ticket-screen";

export const Route = createFileRoute("/_app/support/$ticketId")({
    head: ({ match }) => {
        // A missing ticket keeps the 404 page's title, which the root sets.
        if (match.status === "notFound") {
            return {};
        }

        return { meta: [{ title: "Ticket · Suporte · Nelcota" }] };
    },
    loader: async ({ context, params }): Promise<void> => {
        const ticketId = params.ticketId;
        const queryClient = context.queryClient;

        await loadTicket(ticketId, () =>
            queryClient.ensureQueryData(myTicketQueryOptions(ticketId)),
        );
    },
    component: TicketRoute,
});

function TicketRoute(): ReactNode {
    const params = Route.useParams();

    return <TicketScreen key={params.ticketId} ticketId={params.ticketId} />;
}
