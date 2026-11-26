import { createFileRoute, redirect } from "@tanstack/react-router";

// Início left the app: each area opens with its own "Comece por aqui", and the Editor Oculto one
// is where people land. Old links and bookmarks to "/" still arrive there.
export const Route = createFileRoute("/_app/")({
    beforeLoad: () => {
        throw redirect({ to: "/getting-started", replace: true });
    },
});
