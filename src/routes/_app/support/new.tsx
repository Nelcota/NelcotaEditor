import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { newTicketSearchSchema } from "#/modules/support/model/support-ticket";
import { NewTicketScreen } from "#/modules/support/ui/screens/new-ticket-screen";

export const Route = createFileRoute("/_app/support/new")({
    validateSearch: newTicketSearchSchema,
    head: () => ({ meta: [{ title: "Abrir ticket · Nelcota" }] }),
    component: NewTicketRoute,
});

function NewTicketRoute(): ReactNode {
    const search = Route.useSearch();

    return <NewTicketScreen videoId={search.videoId ?? null} />;
}
