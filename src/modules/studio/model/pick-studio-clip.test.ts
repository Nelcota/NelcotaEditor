import { describe, expect, it } from "vitest";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { pickStudioClip } from "#/modules/studio/model/pick-studio-clip";

function createClip(id: string): ClipView {
    return {
        id,
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
}

const BEST = createClip("clip-best");
const SECOND = createClip("clip-second");

describe("pickStudioClip", () => {
    it("opens the best clip when the address names none", () => {
        expect(pickStudioClip([BEST, SECOND], undefined)).toEqual({ kind: "found", clip: BEST });
    });

    it("opens the clip the address names", () => {
        expect(pickStudioClip([BEST, SECOND], SECOND.id)).toEqual({ kind: "found", clip: SECOND });
    });

    it("says the named clip is missing instead of opening another one", () => {
        expect(pickStudioClip([BEST, SECOND], "clip-deleted")).toEqual({
            kind: "missing",
            bestClip: BEST,
        });
    });

    it("finds nothing to edit before the video has clips", () => {
        expect(pickStudioClip([], undefined)).toEqual({ kind: "none" });
    });
});
