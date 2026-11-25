// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBreadcrumbs } from "#/modules/shell/ui/hooks/use-breadcrumbs";
import { videoDetailsQueryOptions } from "#/modules/videos/model/video-queries";
import type { VideoDetails } from "#/modules/videos/model/video-views";

const location = { pathname: "/" };

vi.mock("@tanstack/react-router", () => ({
    isNotFound: () => false,
    useLocation: ({ select }: { select: (current: { pathname: string }) => string }) =>
        select(location),
}));
// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/videos/server/video-functions", () => ({}));

function renderCrumbs(
    pathname: string,
    queryClient: QueryClient = new QueryClient(),
): ReturnType<typeof useBreadcrumbs> {
    location.pathname = pathname;
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useBreadcrumbs(), { wrapper }).result.current;
}

const VIDEO_ID = "0193b4a0-0000-7000-8000-000000000001";

const VIDEO_DETAILS: VideoDetails = {
    video: {
        id: VIDEO_ID,
        title: "Entrevista",
        source: "upload",
        status: "done",
        progressPercent: 100,
        errorMessage: null,
        isCancelling: false,
        durationSeconds: 600,
        requestedClipCount: 3,
        clipLength: "minute",
        readyClipCount: 3,
        createdAt: "2026-11-20T12:00:00.000Z",
        processingStartedAt: null,
        sourceUrl: null,
        thumbnailUrl: null,
        originalFileUrl: null,
    },
    clips: [],
};

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

    it("names an open video by the title its page loaded", () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(videoDetailsQueryOptions(VIDEO_ID).queryKey, VIDEO_DETAILS);

        expect(renderCrumbs(`/videos/${VIDEO_ID}`, queryClient).at(-1)?.label).toBe("Entrevista");
    });

    it("leaves the video cache untouched on a page that is not a video", () => {
        const queryClient = new QueryClient();

        renderCrumbs("/clips", queryClient);

        expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
});
