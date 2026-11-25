import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "#/modules/admin/ui/screens/admin-layout";

// Hiding the pages is only for the person's convenience: every admin server function checks the
// role again on the server.
export const Route = createFileRoute("/_app/admin")({
    beforeLoad: ({ context }) => {
        if (context.user.isAdmin === false) {
            throw redirect({ to: "/", replace: true });
        }
    },
    head: () => ({ meta: [{ title: "Admin · Editor Oculto" }] }),
    component: AdminLayout,
});
