import { notFound } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { pollVideoDetails } from "#/modules/videos/model/video-queries";
import type { VideoDetails } from "#/modules/videos/model/video-views";

// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/videos/server/video-functions", () => ({
    getVideoDetails: vi.fn(),
    listVideos: vi.fn(),
}));

const PROCESSING_DETAILS: VideoDetails = {
    video: {
        id: "video-1",
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
        processingStartedAt: "2026-11-20T12:00:00.000Z",
        sourceUrl: null,
        thumbnailUrl: null,
        originalFileUrl: null,
    },
    clips: [],
};

describe("pollVideoDetails", () => {
    it("keeps polling a video that is still processing", () => {
        expect(pollVideoDetails(PROCESSING_DETAILS, null)).not.toBe(false);
    });

    it("stops polling once the video is gone", () => {
        expect(pollVideoDetails(PROCESSING_DETAILS, notFound())).toBe(false);
    });
});
