import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "#/styles.css?url";

interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "color-scheme", content: "dark" },
            // Matches --background so the mobile browser bar blends with the app.
            { name: "theme-color", content: "#0d0d0f" },
            { title: "Nelcota — cortes com legenda" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", type: "image/png", href: "/favicon.png" },
        ],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }): ReactNode {
    return (
        <html lang="pt-BR">
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
