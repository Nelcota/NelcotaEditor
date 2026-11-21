import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    MAX_VIDEO_TITLE_LENGTH,
    toStoredVideoTitle,
    truncateText,
    videoTitleSchema,
} from "#/modules/video-records/video-title";

const EMOJI = String.fromCodePoint(0x1f600);

describe("truncateText", () => {
    it("cuts by code points, so an emoji is never split in half", () => {
        const truncated = truncateText(`ab${EMOJI}cd`, 3);

        assert.equal(truncated, `ab${EMOJI}`);
    });

    it("trims the space left at the cut", () => {
        assert.equal(truncateText("abc def", 4), "abc");
    });
});

describe("toStoredVideoTitle", () => {
    it("returns null for an empty title and the yt-dlp placeholder", () => {
        assert.equal(toStoredVideoTitle("   "), null);
        assert.equal(toStoredVideoTitle(" NA "), null);
    });

    it("keeps a long title within what the rename form accepts", () => {
        const stored = toStoredVideoTitle(EMOJI.repeat(MAX_VIDEO_TITLE_LENGTH + 10));

        assert.ok(stored !== null);
        assert.equal(Array.from(stored).length, MAX_VIDEO_TITLE_LENGTH);
        assert.equal(videoTitleSchema.safeParse(stored).success, true);
    });
});

describe("videoTitleSchema", () => {
    it("counts emojis as one character each", () => {
        const atLimit = EMOJI.repeat(MAX_VIDEO_TITLE_LENGTH);

        assert.equal(videoTitleSchema.safeParse(atLimit).success, true);
        assert.equal(videoTitleSchema.safeParse(`${atLimit}a`).success, false);
    });

    it("rejects a blank title", () => {
        assert.equal(videoTitleSchema.safeParse("   ").success, false);
    });
});
