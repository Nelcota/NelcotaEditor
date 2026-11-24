// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { readDraftBackup } from "#/modules/studio/client/draft-backup";
import { clipStudioQueryKey } from "#/modules/studio/model/studio-queries";
import { saveClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { useDraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";
import type { DraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";

// The server function is the network call to the server; the hook's job is when it is sent.
vi.mock("#/modules/studio/server/clip-studio-functions", () => ({
    saveClipDraft: vi.fn(),
}));

const VIDEO_ID = "video-1";
const CLIP_ID = "clip-1";

const SAVED_DRAFT: StudioDraft = {
    startSeconds: 10,
    endSeconds: 40,
    aspectRatio: "vertical",
    captionStyle: "karaoke",
    captionColor: "yellow",
    captionSize: "medium",
    captionPosition: "bottom",
    captionFont: "montserrat",
    cues: [],
};

const EDITED_DRAFT: StudioDraft = { ...SAVED_DRAFT, captionColor: "green" };

interface AutosaveProps {
    draft: StudioDraft;
}

function renderAutosave(queryClient: QueryClient): RenderHookResult<DraftAutosave, AutosaveProps> {
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(
        ({ draft }: AutosaveProps) =>
            useDraftAutosave({
                videoId: VIDEO_ID,
                clipId: CLIP_ID,
                draft,
                initialVersion: 3,
                savedDraft: SAVED_DRAFT,
            }),
        { wrapper, initialProps: { draft: SAVED_DRAFT } },
    );
}

beforeEach(() => {
    vi.mocked(saveClipDraft).mockResolvedValue({ kind: "saved", draftVersion: 4 });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
});

describe("useDraftAutosave", () => {
    it("saves an edit still waiting for its delay when the Studio closes", async () => {
        const queryClient = new QueryClient();
        const rendered = renderAutosave(queryClient);
        rendered.rerender({ draft: EDITED_DRAFT });

        rendered.unmount();

        await waitFor(() => {
            expect(saveClipDraft).toHaveBeenCalledWith({
                data: {
                    videoId: VIDEO_ID,
                    clipId: CLIP_ID,
                    expectedVersion: 3,
                    draft: EDITED_DRAFT,
                },
            });
        });
    });

    it("drops the clip's cached snapshot after closing, so reopening reads the saved draft", async () => {
        const queryClient = new QueryClient();
        const queryKey = clipStudioQueryKey(VIDEO_ID, CLIP_ID);
        queryClient.setQueryData(queryKey, { draft: SAVED_DRAFT, draftVersion: 3 });
        const rendered = renderAutosave(queryClient);
        rendered.rerender({ draft: EDITED_DRAFT });

        rendered.unmount();

        await waitFor(() => {
            expect(queryClient.getQueryData(queryKey)).toBeUndefined();
        });
    });

    it("keeps the edit in this browser when the closing save fails", async () => {
        vi.mocked(saveClipDraft).mockRejectedValue(new TypeError("Failed to fetch"));
        vi.stubGlobal("reportError", vi.fn());
        const queryClient = new QueryClient();
        const rendered = renderAutosave(queryClient);
        rendered.rerender({ draft: EDITED_DRAFT });

        rendered.unmount();

        await waitFor(() => {
            expect(readDraftBackup(CLIP_ID)?.draft).toEqual(EDITED_DRAFT);
        });
    });
});
