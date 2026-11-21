import { createFileRoute } from "@tanstack/react-router";
import { ClipsScreen } from "#/modules/videos/ui/clips-screen";

export const Route = createFileRoute("/_app/clips")({
    head: () => ({ meta: [{ title: "Cortes · Nelcota" }] }),
    component: ClipsScreen,
});
