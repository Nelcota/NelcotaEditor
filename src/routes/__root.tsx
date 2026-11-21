import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { THEME_COLOR_META, THEME_HEAD_SCRIPT } from "#/modules/shell/theme-head";
import appCss from "#/styles.css?url";

interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "color-scheme", content: "light" },
            THEME_COLOR_META,
            { title: "Nelcota: cortes com legenda" },
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
