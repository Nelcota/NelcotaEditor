// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { videoDetailsQueryOptions } from "#/modules/videos/model/video-queries";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { getVideoDetails } from "#/modules/videos/server/video-functions";
import { VideoDetailsScreen } from "#/modules/videos/ui/screens/video-details-screen";

// Server functions are the network calls; outside the app's build they load the server's
// environment. The screen only needs the router's links to render as anchors.
vi.mock("#/modules/videos/server/video-functions", () => ({
    listVideos: vi.fn(),
    countVideos: vi.fn(),
    getVideoDetails: vi.fn(),
}));
vi.mock("#/modules/videos/server/video-edit-functions", () => ({}));
vi.mock("#/modules/clips/server/clip-sharing-functions", () => ({}));
vi.mock("#/modules/transcription/server/transcript-functions", () => ({}));
vi.mock("@tanstack/react-router", async (importOriginal) => {
    const router = await importOriginal<typeof import("@tanstack/react-router")>();

    return {
        ...router,
        Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
        useNavigate: () => vi.fn(),
    };
});

const VIDEO_ID = "0193b4a0-0000-7000-8000-000000000001";
const POLL_INTERVAL_MILLISECONDS = 2_500;

const TRANSCRIBING_DETAILS: VideoDetails = {
    video: {
        id: VIDEO_ID,
        title: "Entrevista",
        source: "upload",
        status: "transcribing",
        progressPercent: 40,
        errorMessage: null,
        isCancelling: false,
        durationSeconds: 600,
        requestedClipCount: 3,
        clipLength: "minute",
        readyClipCount: 0,
        createdAt: "2026-11-20T12:00:00.000Z",
        processingStartedAt: null,
        sourceUrl: null,
        thumbnailUrl: null,
        originalFileUrl: null,
    },
    clips: [],
};

function StudioTabStub(): ReactNode {
    return <p>Studio aberto</p>;
}

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
});

describe("VideoDetailsScreen", () => {
    it("shows the not found page when the video is deleted in another tab while it processes", async () => {
        vi.mocked(getVideoDetails).mockRejectedValue(notFound());
        // Only the poll asks the server again, as on a page that has been open for a while.
        const queryClient = new QueryClient({
            defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
        });
        queryClient.setQueryData(videoDetailsQueryOptions(VIDEO_ID).queryKey, TRANSCRIBING_DETAILS);
        render(
            <QueryClientProvider client={queryClient}>
                <VideoDetailsScreen
                    videoId={VIDEO_ID}
                    search={{ tab: "studio" }}
                    StudioTab={StudioTabStub}
                />
            </QueryClientProvider>,
        );
        expect(screen.getByText("Studio aberto")).toBeDefined();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MILLISECONDS);
        });

        expect(await screen.findByRole("heading", { name: "Página não encontrada" })).toBeDefined();
        expect(screen.queryByText("Studio aberto")).toBeNull();
    });
});
