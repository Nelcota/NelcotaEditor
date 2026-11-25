import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { loadSharedClip } from "#/modules/clips/model/load-shared-clip";
import { buildSharedClipHead } from "#/modules/clips/model/shared-clip-head";
import { SharedClipScreen } from "#/modules/clips/ui/screens/shared-clip-screen";

export const Route = createFileRoute("/c/$token")({
    loader: ({ params }) => loadSharedClip(params.token),
    head: ({ loaderData }) => {
        // A link that no longer opens keeps the 404 page's title, which the root sets.
        if (loaderData === undefined) {
            return {};
        }

        return { meta: buildSharedClipHead(loaderData) };
    },
    component: SharedClipPage,
});

function SharedClipPage(): ReactNode {
    const sharedClip = Route.useLoaderData();

    return <SharedClipScreen clip={sharedClip} />;
}
