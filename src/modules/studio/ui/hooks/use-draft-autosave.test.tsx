// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { readDraftBackup } from "#/modules/studio/client/draft-backup";
import type { SaveDraftResult } from "#/modules/studio/model/clip-studio-view";
import { clipDraftLeaveSaveKey, clipStudioQueryKey } from "#/modules/studio/model/studio-queries";
import { saveClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { useDraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";
import type { DraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";

// Server functions are the network calls to the server; the hook's job is when the save is sent.
// The query modules the hook reads keys from import the others, and outside the app's build those
// files load the server's environment, which CI does not have.
vi.mock("#/modules/studio/server/clip-studio-functions", () => ({
    saveClipDraft: vi.fn(),
}));
vi.mock("#/modules/studio/server/clip-studio-snapshot-functions", () => ({}));
vi.mock("#/modules/videos/server/video-functions", () => ({}));

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

    it("moves the cached snapshot to the saved draft and version, so reopening builds on them", async () => {
        const queryClient = new QueryClient();
        const queryKey = clipStudioQueryKey(VIDEO_ID, CLIP_ID);
        queryClient.setQueryData(queryKey, { draft: SAVED_DRAFT, draftVersion: 3 });
        const rendered = renderAutosave(queryClient);
        rendered.rerender({ draft: EDITED_DRAFT });

        rendered.unmount();

        await waitFor(() => {
            expect(queryClient.getQueryData(queryKey)).toEqual({
                draft: EDITED_DRAFT,
                draftVersion: 4,
            });
        });
    });

    it("marks the closing save as pending until it lands, so the Studio waits to reopen", async () => {
        const save: { finish: ((result: SaveDraftResult) => void) | null } = { finish: null };
        const pendingSave = new Promise<SaveDraftResult>((resolve) => {
            save.finish = resolve;
        });
        vi.mocked(saveClipDraft).mockReturnValue(pendingSave);
        const queryClient = new QueryClient();
        const mutationKey = clipDraftLeaveSaveKey(VIDEO_ID, CLIP_ID);
        const rendered = renderAutosave(queryClient);
        rendered.rerender({ draft: EDITED_DRAFT });

        rendered.unmount();

        await waitFor(() => {
            expect(queryClient.isMutating({ mutationKey })).toBe(1);
        });
        save.finish?.({ kind: "saved", draftVersion: 4 });
        await waitFor(() => {
            expect(queryClient.isMutating({ mutationKey })).toBe(0);
        });
    });

    it("keeps saving on flush until the server holds a draft edited during the save", async () => {
        const queryClient = new QueryClient();
        const rendered = renderAutosave(queryClient);
        const laterDraft: StudioDraft = { ...EDITED_DRAFT, captionSize: "large" };
        vi.mocked(saveClipDraft)
            .mockImplementationOnce(async () => {
                rendered.rerender({ draft: laterDraft });
                return { kind: "saved", draftVersion: 4 };
            })
            .mockResolvedValueOnce({ kind: "saved", draftVersion: 5 });
        rendered.rerender({ draft: EDITED_DRAFT });

        // Not inside act: React would hold the edit's effect until the whole flush ended.
        const outcome = await rendered.result.current.flush();

        expect(outcome).toBe("saved");
        expect(saveClipDraft).toHaveBeenLastCalledWith({
            data: { videoId: VIDEO_ID, clipId: CLIP_ID, expectedVersion: 4, draft: laterDraft },
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
