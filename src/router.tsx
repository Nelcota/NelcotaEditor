import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "#/routeTree.gen";
import { NotFoundScreen } from "#/shared/ui/not-found-screen";
import { RouteErrorScreen } from "#/shared/ui/route-error-screen";

const STALE_TIME_MILLISECONDS = 5_000;

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
        defaultNotFoundComponent: NotFoundScreen,
        defaultErrorComponent: RouteErrorScreen,
    });

    setupRouterSsrQueryIntegration({ router, queryClient });
    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
