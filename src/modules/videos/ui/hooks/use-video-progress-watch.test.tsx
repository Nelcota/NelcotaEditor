// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { VideoListPage } from "#/modules/videos/model/video-list-page";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { listVideos } from "#/modules/videos/server/video-functions";
import { getVideoProgress } from "#/modules/videos/server/video-progress-functions";
import { useStageAnnouncement } from "#/modules/videos/ui/hooks/use-stage-announcement";
import { useVideoProgressWatch } from "#/modules/videos/ui/hooks/use-video-progress-watch";

// Server functions are the network calls; outside the app's build they load the server's
// environment.
vi.mock("#/modules/videos/server/video-functions", () => ({
    listVideos: vi.fn(),
    countVideos: vi.fn(),
    getVideoDetails: vi.fn(),
}));
vi.mock("#/modules/videos/server/video-progress-functions", () => ({
    getVideoProgress: vi.fn(),
}));

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
});

const POLL_INTERVAL_MILLISECONDS = 2_500;

function buildVideo(status: VideoStatus): VideoSummary {
    return {
        id: "video-1",
        title: "Entrevista",
        source: "upload",
        status,
        progressPercent: 80,
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
    };
}

function toPage(items: Array<VideoSummary>): VideoListPage {
    return { items, nextCursor: null, totalCount: items.length };
}

function StageAnnouncer(): ReactNode {
    const announcement = useStageAnnouncement(useVideoProgressWatch());

    return <p role="status">{announcement}</p>;
}

describe("useVideoProgressWatch", () => {
    it("announces a video as ready when the poll that sees it finish also drops it from the watched list", async () => {
        const transcribing = buildVideo("transcribing");
        vi.mocked(listVideos)
            .mockResolvedValueOnce(toPage([transcribing]))
            .mockResolvedValue(toPage([]));
        vi.mocked(getVideoProgress).mockResolvedValue([
            {
                id: transcribing.id,
                title: transcribing.title,
                status: "done",
                progressPercent: 100,
                isCancelling: false,
                readyClipCount: 3,
            },
        ]);
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <StageAnnouncer />
            </QueryClientProvider>,
        );

        await vi.waitFor(async () => {
            await act(async () => {
                await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MILLISECONDS);
            });
            expect(getVideoProgress).toHaveBeenCalled();
        });

        expect(await screen.findByText("Entrevista: Pronto")).toBeDefined();
    });
});
