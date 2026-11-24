// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { deleteVideo } from "#/modules/videos/server/video-functions";
import { DeleteVideoDialog } from "#/modules/videos/ui/components/delete-video-dialog";

// Server functions are the network calls; outside the app's build they load the server's
// environment. The dialog only navigates after a delete, which these tests never reach.
vi.mock("#/modules/videos/server/video-functions", () => ({ deleteVideo: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

const REFUSAL = "Este vídeo ainda está em processamento.";

const VIDEO: VideoSummary = {
    id: "video-1",
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
};

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

/** Opens and closes the dialog the way the video menu does. */
function DialogHost(): ReactNode {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button type="button" onClick={() => setIsOpen(true)}>
                Excluir
            </button>
            <DeleteVideoDialog video={VIDEO} isOpen={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}

describe("DeleteVideoDialog", () => {
    it("forgets a failed delete once it is closed", async () => {
        vi.mocked(deleteVideo).mockRejectedValue(new Error(REFUSAL));
        const user = userEvent.setup();
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <DialogHost />
            </QueryClientProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Excluir" }));
        await user.click(screen.getByRole("button", { name: "Entendi, continuar" }));
        await user.click(screen.getByRole("button", { name: "Excluir vídeo" }));
        expect(await screen.findByText(REFUSAL)).toBeDefined();

        await user.keyboard("{Escape}");
        await user.click(screen.getByRole("button", { name: "Excluir" }));

        expect(screen.queryByText(REFUSAL)).toBeNull();
    });

    it("forgets the deleted video's page so going back does not show it", async () => {
        vi.mocked(deleteVideo).mockResolvedValue(undefined);
        const user = userEvent.setup();
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const detailsKey = ["videos", VIDEO.id];
        queryClient.setQueryData(detailsKey, { video: VIDEO, clips: [] });
        render(
            <QueryClientProvider client={queryClient}>
                <DialogHost />
            </QueryClientProvider>,
        );
        await user.click(screen.getByRole("button", { name: "Excluir" }));
        await user.click(screen.getByRole("button", { name: "Entendi, continuar" }));
        await user.click(screen.getByRole("button", { name: "Excluir vídeo" }));

        await waitFor(() => expect(queryClient.getQueryState(detailsKey)).toBeUndefined());
    });
});
