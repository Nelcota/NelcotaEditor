import { createFileRoute } from "@tanstack/react-router";
import { GettingStartedScreen } from "#/modules/shell/ui/screens/getting-started-screen";

export const Route = createFileRoute("/_app/getting-started")({
    head: () => ({ meta: [{ title: "Comece por aqui · Editor Oculto" }] }),
    component: GettingStartedScreen,
});
