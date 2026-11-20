import { createFileRoute, redirect } from "@tanstack/react-router";

// Usage now lives on the account page; old links keep working.
export const Route = createFileRoute("/_app/usage")({
    beforeLoad: () => {
        throw redirect({ to: "/account", replace: true });
    },
});
