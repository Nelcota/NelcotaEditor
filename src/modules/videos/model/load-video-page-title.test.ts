import { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadVideoPageTitle } from "#/modules/videos/model/load-video-page-title";
import { getVideoDetails } from "#/modules/videos/server/video-functions";

// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/videos/server/video-functions", () => ({
    getVideoDetails: vi.fn(),
    listVideos: vi.fn(),
}));

const VIDEO_ID = "0193a7f0-0000-7000-8000-000000000001";

afterEach(() => {
    vi.clearAllMocks();
});

async function catchError(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
    } catch (error) {
        return error;
    }

    throw new Error("Expected the promise to reject");
}

describe("loadVideoPageTitle", () => {
    it("answers not found for a malformed id without asking the server", async () => {
        const queryClient = new QueryClient();

        const error = await catchError(loadVideoPageTitle(queryClient, "abc"));

        expect(isNotFound(error)).toBe(true);
        expect(getVideoDetails).not.toHaveBeenCalled();
    });

    it("lets a failure other than not found reach the error page", async () => {
        const failure = new Error("Database unavailable");
        vi.mocked(getVideoDetails).mockRejectedValue(failure);
        const queryClient = new QueryClient();

        const error = await catchError(loadVideoPageTitle(queryClient, VIDEO_ID));

        expect(error).toBe(failure);
    });
});
