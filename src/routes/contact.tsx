import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { appSwitchStatesQueryOptions } from "#/modules/app-switches/model/app-switch-queries";
import { FEATURE_TURNED_OFF_MESSAGES } from "#/modules/app-switches/model/feature-turned-off-error";
import { getCaptchaSiteKey } from "#/modules/auth/server/captcha-functions";
import { ContactScreen } from "#/modules/support/ui/screens/contact-screen";

export const Route = createFileRoute("/contact")({
    head: () => ({ meta: [{ title: "Contato · Nelcota" }] }),
    loader: async ({ context }) => {
        const [captchaSiteKey, switches] = await Promise.all([
            getCaptchaSiteKey(),
            context.queryClient.fetchQuery({ ...appSwitchStatesQueryOptions(), staleTime: 0 }),
        ]);

        return { captchaSiteKey, isSupportOpen: switches.support };
    },
    component: ContactRoute,
});

function ContactRoute(): ReactNode {
    const { captchaSiteKey, isSupportOpen } = Route.useLoaderData();
    let pausedMessage: string | null = null;

    if (isSupportOpen === false) {
        pausedMessage = FEATURE_TURNED_OFF_MESSAGES.support;
    }

    return <ContactScreen captchaSiteKey={captchaSiteKey} pausedMessage={pausedMessage} />;
}
