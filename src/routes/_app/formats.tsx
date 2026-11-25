import { createFileRoute } from "@tanstack/react-router";
import { FormatsScreen } from "#/modules/viral-formats/ui/screens/formats-screen";

export const Route = createFileRoute("/_app/formats")({
    head: () => ({ meta: [{ title: "Formatos Virais · Editor Oculto" }] }),
    component: FormatsScreen,
});
