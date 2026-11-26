import { createFileRoute } from "@tanstack/react-router";
import { ClaudeConnectionScreen } from "#/modules/viral-formats/ui/screens/claude-connection-screen";

export const Route = createFileRoute("/_app/claude")({
    head: () => ({ meta: [{ title: "Etapa 1 · Conectar Claude · Editor Oculto" }] }),
    component: ClaudeConnectionScreen,
});
