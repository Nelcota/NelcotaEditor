import { createFileRoute } from "@tanstack/react-router";
import { EditsScreen } from "#/modules/viral-formats/ui/screens/edits-screen";

export const Route = createFileRoute("/_app/edits/")({
    head: () => ({ meta: [{ title: "Minhas edições · Editor Oculto" }] }),
    component: EditsScreen,
});
