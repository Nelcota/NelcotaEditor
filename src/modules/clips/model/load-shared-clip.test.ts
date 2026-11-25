import { isNotFound } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSharedClip } from "#/modules/clips/model/load-shared-clip";
import type { SharedClip } from "#/modules/clips/model/shared-clip";
import { getSharedClip } from "#/modules/clips/server/shared-clip-functions";

// Server functions are the network calls; outside the app's build they load the server's environment.
vi.mock("#/modules/clips/server/shared-clip-functions", () => ({ getSharedClip: vi.fn() }));

const TOKEN = "abcdefghijklmnopqrstuvwxyz012345";

const SHARED_CLIP: SharedClip = {
    title: "O melhor momento",
    aspectRatio: "vertical",
    durationSeconds: 42,
    videoPath: "/api/share/token",
    pageUrl: `https://nelcota.example/c/${TOKEN}`,
    videoUrl: `https://nelcota.example/api/share/${TOKEN}`,
    posterUrl: `https://nelcota.example/api/share/${TOKEN}/poster`,
};

async function catchError(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
    } catch (error) {
        return error;
    }

    throw new Error("Expected the promise to reject");
}

describe("loadSharedClip", () => {
    beforeEach(() => {
        vi.mocked(getSharedClip).mockReset();
    });

    it("returns the clip behind a link that opens", async () => {
        vi.mocked(getSharedClip).mockResolvedValue(SHARED_CLIP);

        const sharedClip = await loadSharedClip(TOKEN);

        expect(sharedClip).toEqual(SHARED_CLIP);
    });

    it("answers 404 for a link that no longer opens", async () => {
        vi.mocked(getSharedClip).mockResolvedValue(null);

        const error = await catchError(loadSharedClip(TOKEN));

        expect(isNotFound(error)).toBe(true);
    });

    it("answers 404 for a malformed token without asking the server", async () => {
        const error = await catchError(loadSharedClip("not-a-token"));

        expect(isNotFound(error)).toBe(true);
        expect(getSharedClip).not.toHaveBeenCalled();
    });
});
