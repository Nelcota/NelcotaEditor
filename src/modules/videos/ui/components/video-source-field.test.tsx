// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_SOURCE } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { VideoSourceField } from "#/modules/videos/ui/components/video-source-field";

// Server functions are the network calls; outside the app's build they load the server's
// environment.
vi.mock("#/modules/app-switches/server/app-switch-functions", async () => {
    const { DEFAULT_APP_SWITCH_STATES } = await import("#/modules/app-switches/model/app-switch");

    return { getAppSwitchStates: async () => DEFAULT_APP_SWITCH_STATES };
});
vi.mock("#/modules/videos/server/youtube-preview-functions", () => ({
    getYoutubePreview: vi.fn(),
}));

const DROP_PROMPT = "Solte para enviar";

afterEach(() => {
    cleanup();
});

function renderField(): (source: VideoSource) => void {
    const onSourceChange = vi.fn<(source: VideoSource) => void>();
    render(
        <QueryClientProvider client={new QueryClient()}>
            <VideoSourceField
                source={EMPTY_SOURCE}
                disabled={false}
                isSubmitAttempted={false}
                onSourceChange={onSourceChange}
            />
        </QueryClientProvider>,
    );

    return onSourceChange;
}

describe("VideoSourceField", () => {
    it("keeps the drop zone while the file moves over its text", () => {
        renderField();
        fireEvent.dragOver(screen.getByLabelText("Link do YouTube"));
        const prompt = screen.getByText(DROP_PROMPT);
        const zone = prompt.parentElement;

        if (zone === null) {
            throw new Error("The drop prompt has no zone around it");
        }

        // The browser fires a leave on the zone when the pointer enters one of its children.
        fireEvent(zone, new MouseEvent("dragleave", { bubbles: true, relatedTarget: prompt }));

        expect(screen.queryByText(DROP_PROMPT)).not.toBeNull();
    });

    it("takes a file dropped before the drop zone shows", () => {
        const onSourceChange = renderField();
        const file = new File([new Uint8Array(16)], "gravação.mp4", { type: "video/mp4" });

        const isDefaultAllowed = fireEvent.drop(screen.getByLabelText("Link do YouTube"), {
            dataTransfer: { files: [file] },
        });

        expect(isDefaultAllowed).toBe(false);
        expect(onSourceChange).toHaveBeenCalledWith({ kind: "file", file });
    });
});
