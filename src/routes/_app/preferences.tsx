import { createFileRoute, redirect } from "@tanstack/react-router";

// Preferences now live on the account page; old links keep working.
export const Route = createFileRoute("/_app/preferences")({
    beforeLoad: () => {
        throw redirect({ to: "/account", replace: true });
    },
});
