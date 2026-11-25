import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { resetPasswordSearchSchema } from "#/modules/auth/model/auth-forms";
import { ResetPasswordScreen } from "#/modules/auth/ui/screens/reset-password-screen";

export const Route = createFileRoute("/reset-password")({
    head: () => ({ meta: [{ title: "Nova senha · Editor Oculto" }] }),
    validateSearch: resetPasswordSearchSchema,
    component: ResetPasswordPage,
});

function ResetPasswordPage(): ReactNode {
    const { token } = Route.useSearch();

    return <ResetPasswordScreen token={token ?? null} />;
}
