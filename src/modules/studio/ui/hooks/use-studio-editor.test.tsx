// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import type { ClipView } from "#/modules/clips/model/clip-view";
import type { ClipStudioView } from "#/modules/studio/model/clip-studio-view";
import { clipStudioQueryKey } from "#/modules/studio/model/studio-queries";
import { getClipStudioSnapshot } from "#/modules/studio/server/clip-studio-snapshot-functions";
import type { ClipStudioSnapshot } from "#/modules/studio/server/clip-studio-snapshot-functions";
import { useStudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";

// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/studio/server/clip-studio-functions", () => ({
    saveClipDraft: vi.fn(),
    renderClipDraft: vi.fn(),
}));
vi.mock("#/modules/studio/server/clip-studio-snapshot-functions", () => ({
    getClipStudioSnapshot: vi.fn(),
}));
vi.mock("#/modules/videos/server/video-functions", () => ({}));

const VIDEO_ID = "video-1";

const CLIP: ClipView = {
    id: "clip-1",
    position: 0,
    title: "Abertura",
    reason: "Começo forte",
    startSeconds: 10,
    endSeconds: 40,
    score: 90,
    status: "done",
    aspectRatio: "vertical",
    captionStyle: "karaoke",
    fileUrl: null,
    downloadUrl: null,
    sharePath: null,
    isShared: false,
};

const APPLIED_SETTINGS: Omit<StudioDraft, "cues"> = {
    startSeconds: 10,
    endSeconds: 40,
    aspectRatio: "vertical",
    captionStyle: "karaoke",
    captionColor: "yellow",
    captionSize: "medium",
    captionPosition: "bottom",
    captionFont: "montserrat",
};

const APPLIED: StudioDraft = { ...APPLIED_SETTINGS, cues: [] };

const STUDIO: ClipStudioView = {
    clip: CLIP,
    applied: APPLIED,
    draft: null,
    draftVersion: 3,
    videoDurationSeconds: 600,
    words: [],
};

/** Another tab rendered a new color: the applied draft itself moved on. */
const THEIR_SNAPSHOT: ClipStudioSnapshot = {
    clip: CLIP,
    appliedSettings: { ...APPLIED_SETTINGS, captionColor: "green" },
    appliedCues: [],
    draft: null,
    draftVersion: 5,
    videoDurationSeconds: 600,
};

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
});

describe("useStudioEditor", () => {
    it("brings the other tab's applied draft into the cache when taking theirs", async () => {
        vi.mocked(getClipStudioSnapshot).mockResolvedValue(THEIR_SNAPSHOT);
        const queryClient = new QueryClient();
        const queryKey = clipStudioQueryKey(VIDEO_ID, CLIP.id);
        queryClient.setQueryData(queryKey, { ...THEIR_SNAPSHOT, draftVersion: 3 });
        const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const rendered = renderHook(() => useStudioEditor(VIDEO_ID, STUDIO), { wrapper });

        await act(async () => {
            await rendered.result.current.takeTheirs();
        });

        expect(queryClient.getQueryData(queryKey)).toEqual(THEIR_SNAPSHOT);
    });
});
