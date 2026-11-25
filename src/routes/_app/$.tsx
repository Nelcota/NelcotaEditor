import { createFileRoute, notFound } from "@tanstack/react-router";

// Unknown addresses land here so a signed-in person keeps the sidebar and tab bar on the 404 page.
export const Route = createFileRoute("/_app/$")({
    beforeLoad: () => {
        throw notFound();
    },
});
