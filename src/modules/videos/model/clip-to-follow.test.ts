import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { pickClipToFollow } from "#/modules/videos/model/clip-to-follow";

function clipView(id: string, startSeconds: number, endSeconds: number): ClipView {
    return {
        id,
        position: 0,
        title: id,
        reason: "",
        startSeconds,
        endSeconds,
        score: 0,
        status: "done",
        aspectRatio: "vertical",
        captionStyle: "karaoke",
        fileUrl: null,
        downloadUrl: null,
        sharePath: null,
        isShared: false,
    };
}

const FIRST_CLIP = clipView("a", 10, 40.9);
const SECOND_CLIP = clipView("b", 40, 70);
const RANKED_CLIPS = [FIRST_CLIP, SECOND_CLIP];

describe("pickClipToFollow", () => {
    it("keeps a lower ranked clip selected at its start when it overlaps a higher ranked one", () => {
        const clip = pickClipToFollow(RANKED_CLIPS, "b", 40);

        assert.equal(clip?.id, "b");
    });

    it("switches to the clip under the playhead once the current one is left", () => {
        const clip = pickClipToFollow(RANKED_CLIPS, "b", 20);

        assert.equal(clip?.id, "a");
    });

    it("picks the highest ranked clip when none is selected", () => {
        const clip = pickClipToFollow(RANKED_CLIPS, null, 40.5);

        assert.equal(clip?.id, "a");
    });

    it("finds no clip outside every clip", () => {
        const clip = pickClipToFollow(RANKED_CLIPS, "a", 80);

        assert.equal(clip, undefined);
    });
});
