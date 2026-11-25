import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { newTicketSearchSchema } from "#/modules/support/model/support-ticket";
import type { TicketTopic } from "#/modules/support/model/support-ticket";
import { NewTicketScreen } from "#/modules/support/ui/screens/new-ticket-screen";

export const Route = createFileRoute("/_app/support/new")({
    validateSearch: newTicketSearchSchema,
    head: () => ({ meta: [{ title: "Nova conversa · Editor Oculto" }] }),
    component: NewTicketRoute,
});

function NewTicketRoute(): ReactNode {
    const search = Route.useSearch();
    const videoId = search.videoId ?? null;
    // A report about a video comes from Meus cortes, so it is about Cortes until the person changes it.
    let topic: TicketTopic | null = search.topic ?? null;

    if (topic === null && videoId !== null) {
        topic = "clips";
    }

    return <NewTicketScreen topic={topic} videoId={videoId} />;
}
