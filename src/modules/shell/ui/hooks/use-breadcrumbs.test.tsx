// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBreadcrumbs } from "#/modules/shell/ui/hooks/use-breadcrumbs";

const location = { pathname: "/" };

vi.mock("@tanstack/react-router", () => ({
    isNotFound: () => false,
    useLocation: ({ select }: { select: (current: { pathname: string }) => string }) =>
        select(location),
}));
// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/videos/server/video-functions", () => ({}));

function renderCrumbs(pathname: string): ReturnType<typeof useBreadcrumbs> {
    location.pathname = pathname;
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useBreadcrumbs(), { wrapper }).result.current;
}

afterEach(() => {
    cleanup();
});

describe("useBreadcrumbs", () => {
    it("names the account page for the old preferences address", () => {
        expect(renderCrumbs("/preferences").at(-1)?.label).toBe("Conta");
    });

    it("names the account page for the old usage address", () => {
        expect(renderCrumbs("/usage").at(-1)?.label).toBe("Conta");
    });
});
