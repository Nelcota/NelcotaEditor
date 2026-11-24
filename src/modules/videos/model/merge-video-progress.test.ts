import { describe, expect, it } from "vitest";
import {
    mergeVideoProgress,
    writeVideoProgress,
} from "#/modules/videos/model/merge-video-progress";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import type { VideoProgress } from "#/modules/videos/server/video-progress-functions";

const RENDERING_VIDEO: VideoSummary = {
    id: "video-1",
    title: "Entrevista",
    source: "upload",
    status: "rendering",
    progressPercent: 80,
    errorMessage: null,
    isCancelling: false,
    durationSeconds: 600,
    requestedClipCount: 3,
    clipLength: "minute",
    readyClipCount: 1,
    createdAt: "2026-11-20T12:00:00.000Z",
    processingStartedAt: null,
    sourceUrl: null,
    thumbnailUrl: null,
    originalFileUrl: null,
};

function toProgress(changes: Partial<VideoProgress>): VideoProgress {
    return {
        id: RENDERING_VIDEO.id,
        title: RENDERING_VIDEO.title,
        status: RENDERING_VIDEO.status,
        progressPercent: RENDERING_VIDEO.progressPercent,
        isCancelling: RENDERING_VIDEO.isCancelling,
        readyClipCount: RENDERING_VIDEO.readyClipCount,
        ...changes,
    };
}

describe("mergeVideoProgress", () => {
    it("counts the clips that finished rendering in the same stage", () => {
        const merged = mergeVideoProgress(
            [RENDERING_VIDEO],
            [RENDERING_VIDEO.id],
            [toProgress({ readyClipCount: 2 })],
        );

        expect(merged?.[0]?.readyClipCount).toBe(2);
    });

    it("keeps the same list when nothing moved", () => {
        const list = [RENDERING_VIDEO];

        expect(mergeVideoProgress(list, [RENDERING_VIDEO.id], [toProgress({})])).toBe(list);
    });

    it("asks for a refetch when the stage changed", () => {
        const merged = mergeVideoProgress(
            [RENDERING_VIDEO],
            [RENDERING_VIDEO.id],
            [toProgress({ status: "done" })],
        );

        expect(merged).toBeNull();
    });
});

describe("writeVideoProgress", () => {
    it("updates a page of the list that holds only some of the watched videos", () => {
        const doneVideo: VideoSummary = { ...RENDERING_VIDEO, id: "video-2", status: "done" };
        const otherProgress: VideoProgress = { ...toProgress({}), id: "video-3" };

        const written = writeVideoProgress(
            [RENDERING_VIDEO, doneVideo],
            [toProgress({ progressPercent: 90 }), otherProgress],
        );

        expect(written.map((video) => video.progressPercent)).toEqual([90, 80]);
    });
});
