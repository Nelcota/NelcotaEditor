import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { THEME_COLOR_META, THEME_HEAD_SCRIPT } from "#/modules/shell/model/theme-head";
import appCss from "#/styles.css?url";

interface RouterContext {
    queryClient: QueryClient;
}

const APP_TITLE = "Nelcota: cortes com legenda";
const NOT_FOUND_TITLE = "Página não encontrada · Nelcota";

interface MatchState {
    status: string;
    /** Set by the router on the route that shows the not-found page for an unknown address. */
    _notFound?: boolean;
}

/** Unknown addresses and missing resources keep the 404 page's own title. */
function pickTitle(matches: Array<MatchState>): string {
    if (matches.some((match) => match.status === "notFound" || match._notFound === true)) {
        return NOT_FOUND_TITLE;
    }

    return APP_TITLE;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: ({ matches }) => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "color-scheme", content: "light" },
            THEME_COLOR_META,
            { title: pickTitle(matches) },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", type: "image/png", href: "/favicon.png" },
        ],
        scripts: [THEME_HEAD_SCRIPT],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }): ReactNode {
    return (
        // The theme script adds the "dark" class before React hydrates; that difference is expected.
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    );
}
