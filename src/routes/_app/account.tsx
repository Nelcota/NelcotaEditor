import { createFileRoute } from "@tanstack/react-router";
import { AccountScreen } from "#/modules/shell/ui/account-screen";

export const Route = createFileRoute("/_app/account")({
    head: () => ({ meta: [{ title: "Conta · Nelcota" }] }),
    component: AccountScreen,
});
