import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SubscriptionPanel } from "#/modules/billing/ui/components/subscription-panel";
import { FormatsScreen } from "#/modules/viral-formats/ui/screens/formats-screen";

function FormatsPage(): ReactNode {
    return <FormatsScreen subscriptionPanel={<SubscriptionPanel />} />;
}

export const Route = createFileRoute("/_app/formats")({
    head: () => ({ meta: [{ title: "Formatos Virais · Editor Oculto" }] }),
    component: FormatsPage,
});
