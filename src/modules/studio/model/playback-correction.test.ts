import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { findPlaybackCorrection } from "#/modules/studio/model/playback-correction";

const RANGE = { startSeconds: 20, endSeconds: 50 };

describe("findPlaybackCorrection", () => {
    it("jumps to the start when the start moved past the playhead", () => {
        assert.equal(findPlaybackCorrection(15, RANGE), "jumpToStart");
    });

    it("stops back at the start once playback reaches the end", () => {
        assert.equal(findPlaybackCorrection(50, RANGE), "rewindAndPause");
    });

    it("leaves playback inside the clip alone", () => {
        assert.equal(findPlaybackCorrection(20, RANGE), "none");
    });
});
