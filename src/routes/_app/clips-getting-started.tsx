import { createFileRoute } from "@tanstack/react-router";
import { ClipsGettingStartedScreen } from "#/modules/videos/ui/screens/clips-getting-started-screen";

export const Route = createFileRoute("/_app/clips-getting-started")({
    head: () => ({ meta: [{ title: "Comece por aqui · Cortes · Editor Oculto" }] }),
    component: ClipsGettingStartedScreen,
});
