import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/modules/shell/ui/screens/home-screen";

export const Route = createFileRoute("/_app/")({
    head: () => ({ meta: [{ title: "Início · Nelcota" }] }),
    component: HomeScreen,
});
