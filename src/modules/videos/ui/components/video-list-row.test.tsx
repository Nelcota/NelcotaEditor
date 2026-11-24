// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { cancelVideo, retryVideo } from "#/modules/videos/server/video-functions";
import { VideoListRow } from "#/modules/videos/ui/components/video-list-row";

// Server functions are the network calls; outside the app's build they load the server's
// environment. The row only needs the router's links to render as anchors.
vi.mock("#/modules/videos/server/video-functions", () => ({
    retryVideo: vi.fn(),
    cancelVideo: vi.fn(),
    renameVideo: vi.fn(),
    deleteVideo: vi.fn(),
}));
vi.mock("#/modules/videos/server/video-edit-functions", () => ({}));
vi.mock("@tanstack/react-router", () => ({
    Link: ({ children }: { children: ReactNode }) => <a href="/videos">{children}</a>,
    useNavigate: () => vi.fn(),
}));

const RESUME_REFUSAL =
    "Você já tem 3 vídeos em processamento. Espere um terminar para enviar outro.";
const CANCEL_REFUSAL = "Este vídeo já terminou.";

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function buildVideo(status: VideoStatus): VideoSummary {
    return {
        id: "video-1",
        title: "Entrevista",
        source: "upload",
        status,
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
    };
}

function renderRow(status: VideoStatus): void {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
        <QueryClientProvider client={queryClient}>
            <ul>
                <VideoListRow video={buildVideo(status)} />
            </ul>
        </QueryClientProvider>,
    );
}

describe("VideoListRow", () => {
    it("shows why resuming a cancelled video failed", async () => {
        vi.mocked(retryVideo).mockRejectedValue(new Error(RESUME_REFUSAL));
        const user = userEvent.setup();
        renderRow("cancelled");

        await user.click(screen.getByRole("button", { name: /ações/i }));
        await user.click(await screen.findByRole("menuitem", { name: /retomar/i }));

        expect((await screen.findByRole("alert")).textContent).toBe(RESUME_REFUSAL);
    });

    it("shows why cancelling a working video failed", async () => {
        vi.mocked(cancelVideo).mockRejectedValue(new Error(CANCEL_REFUSAL));
        const user = userEvent.setup();
        renderRow("transcribing");

        await user.click(screen.getByRole("button", { name: /ações/i }));
        await user.click(await screen.findByRole("menuitem", { name: /cancelar processamento/i }));

        expect((await screen.findByRole("alert")).textContent).toBe(CANCEL_REFUSAL);
    });
});
