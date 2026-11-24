// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider, notifyManager } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Preferences } from "#/modules/preferences/model/preferences";
import { PREFERENCES_QUERY_KEY } from "#/modules/preferences/model/preferences-queries";
import { getPreferences } from "#/modules/preferences/server/preferences-functions";
import { createYoutubeVideo } from "#/modules/videos/server/video-functions";
import { getYoutubePreview } from "#/modules/videos/server/youtube-preview-functions";
import { NewVideoDialog } from "#/modules/videos/ui/components/new-video-dialog";

// Server functions are the network calls; outside the app's build they load the server's
// environment. The wizard only navigates after a success, which these tests never reach.
vi.mock("#/modules/preferences/server/preferences-functions", () => ({ getPreferences: vi.fn() }));
vi.mock("#/modules/videos/server/video-functions", () => ({ createYoutubeVideo: vi.fn() }));
vi.mock("#/modules/videos/server/video-upload-functions", () => ({}));
vi.mock("#/modules/videos/server/youtube-preview-functions", () => ({
    getYoutubePreview: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

const LINK = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
// Not a whole link yet, so the field stays a text box instead of turning into a preview.
const PARTIAL_LINK = "https://www.youtube.com/watch";
const REFUSAL = "Você já tem 3 vídeos em processamento. Espere um terminar para enviar outro.";
const SAVED_PREFERENCES: Preferences = {
    defaultClipCount: 3,
    defaultClipLength: "minute",
    transcriptionLanguage: "pt",
};

interface RenderedDialog {
    user: UserEvent;
    queryClient: QueryClient;
}

beforeEach(() => {
    // Query updates reach components right away, so a refetch shows before the assertion.
    notifyManager.setScheduler((callback) => callback());
    vi.mocked(getPreferences).mockResolvedValue(SAVED_PREFERENCES);
    // The preview is a courtesy that never blocks the form; it stays loading here.
    vi.mocked(getYoutubePreview).mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function renderDialog(): RenderedDialog {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(PREFERENCES_QUERY_KEY, SAVED_PREFERENCES);
    render(
        <QueryClientProvider client={queryClient}>
            <NewVideoDialog isOpen onOpenChange={() => {}} />
        </QueryClientProvider>,
    );

    return { user: userEvent.setup(), queryClient };
}

async function reachReview(user: UserEvent): Promise<void> {
    for (let step = 0; step < 3; step += 1) {
        await user.click(screen.getByRole("button", { name: /continuar/i }));
    }
}

describe("NewVideoDialog", () => {
    it("keeps the chosen video when the preferences refetch", async () => {
        const { user, queryClient } = renderDialog();
        await user.type(screen.getByLabelText("Link do YouTube"), PARTIAL_LINK);

        act(() => {
            queryClient.setQueryData(PREFERENCES_QUERY_KEY, {
                ...SAVED_PREFERENCES,
                defaultClipCount: 5,
            });
        });

        expect(screen.getByLabelText<HTMLInputElement>("Link do YouTube").value).toBe(PARTIAL_LINK);
    });

    it("clears a failed send after going back to change the video", async () => {
        vi.mocked(createYoutubeVideo).mockRejectedValue(new Error(REFUSAL));
        const { user } = renderDialog();
        await user.type(screen.getByLabelText("Link do YouTube"), LINK);
        await reachReview(user);
        await user.click(screen.getByRole("button", { name: "Gerar cortes" }));
        expect(await screen.findByText(REFUSAL)).toBeDefined();

        await user.click(screen.getByRole("button", { name: /voltar/i }));
        await user.click(screen.getByRole("button", { name: /continuar/i }));

        expect(screen.queryByText(REFUSAL)).toBeNull();
    });
});
