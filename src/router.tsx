import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getGlobalStartContext } from "@tanstack/react-start";
import { routeTree } from "#/routeTree.gen";
import { NotFoundScreen } from "#/shared/ui/not-found-screen";
import { RouteErrorScreen } from "#/shared/ui/route-error-screen";

const STALE_TIME_MILLISECONDS = 5_000;
// HeadContent renders the nonce here; the browser hides it on the script tags themselves.
const CSP_NONCE_META_SELECTOR = 'meta[property="csp-nonce"]';

/**
 * Start builds a router outside the request context only to resolve a server function's redirect,
 * which renders no HTML; that router needs no nonce, so the missing context is expected there.
 */
function readServerCspNonce(): string | undefined {
    try {
        return getGlobalStartContext()?.cspNonce;
    } catch (error) {
        if (error instanceof Error) {
            return undefined;
        }

        throw error;
    }
}

/** The request's CSP nonce (set in start.ts) on the server; the one the page was served with in the browser. */
function readCspNonce(): string | undefined {
    if (typeof document === "undefined") {
        return readServerCspNonce();
    }

    const meta = document.querySelector<HTMLMetaElement>(CSP_NONCE_META_SELECTOR);

    if (meta === null) {
        return undefined;
    }

    return meta.content;
}

export function getRouter() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: STALE_TIME_MILLISECONDS } },
    });
    const router = createRouter({
        routeTree,
        context: { queryClient },
        scrollRestoration: true,
        defaultPreload: "intent",
        defaultPreloadStaleTime: 0,
        defaultNotFoundComponent: () => <NotFoundScreen />,
        defaultErrorComponent: RouteErrorScreen,
        ssr: { nonce: readCspNonce() },
    });

    setupRouterSsrQueryIntegration({ router, queryClient });
    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
