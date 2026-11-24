import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { MAX_CAPTION_CUES, studioDraftSchema } from "#/modules/clips/model/clip-studio";
import type { CaptionCue } from "#/modules/clips/model/clip-studio";
import { MAX_CAPTION_WORD_LENGTH } from "#/modules/transcription/model/transcript-word";

function cue(startSeconds: number, endSeconds: number, text: string = "oi"): CaptionCue {
    return { startSeconds, endSeconds, words: [{ text, startSeconds, endSeconds }] };
}

function draft(overrides: Record<string, unknown>): Record<string, unknown> {
    return {
        startSeconds: 10,
        endSeconds: 40,
        aspectRatio: "vertical",
        captionStyle: "karaoke",
        captionColor: "yellow",
        captionSize: "medium",
        captionPosition: "bottom",
        captionFont: "montserrat",
        cues: [],
        ...overrides,
    };
}

function isValid(overrides: Record<string, unknown>): boolean {
    return studioDraftSchema.safeParse(draft(overrides)).success;
}

describe("studioDraftSchema duration", () => {
    it("accepts exactly 15.00 s even when float subtraction gives 14.999999999999998", () => {
        assert.ok(17.74 - 2.74 < 15);
        assert.equal(isValid({ startSeconds: 2.74, endSeconds: 17.74 }), true);
    });

    it("accepts exactly 90.00 s even when float subtraction gives 90.00000000000001", () => {
        assert.ok(128.05 - 38.05 > 90);
        assert.equal(isValid({ startSeconds: 38.05, endSeconds: 128.05 }), true);
    });

    it("rejects 14.99 s and 90.01 s", () => {
        assert.equal(isValid({ startSeconds: 10, endSeconds: 24.99 }), false);
        assert.equal(isValid({ startSeconds: 10, endSeconds: 100.01 }), false);
    });

    it("puts the duration error on endSeconds", () => {
        const result = studioDraftSchema.safeParse(draft({ endSeconds: 20 }));

        assert.equal(result.success, false);
        assert.deepEqual(result.error?.issues[0]?.path, ["endSeconds"]);
    });

    it("rejects NaN, infinite and negative times", () => {
        assert.equal(isValid({ startSeconds: Number.NaN }), false);
        assert.equal(isValid({ endSeconds: Number.POSITIVE_INFINITY }), false);
        assert.equal(isValid({ startSeconds: -1, endSeconds: 20 }), false);
    });
});

describe("studioDraftSchema fields", () => {
    it("defaults the font of drafts saved before fonts existed", () => {
        const input = draft({});
        delete input.captionFont;
        const result = studioDraftSchema.safeParse(input);

        assert.equal(result.success, true);
        assert.equal(result.data?.captionFont, "montserrat");
    });

    it("rejects unknown enum values", () => {
        assert.equal(isValid({ aspectRatio: "portrait" }), false);
        assert.equal(isValid({ captionColor: "orange" }), false);
    });

    it("rejects a blank word and a cue with no words", () => {
        const blankWord = { startSeconds: 11, endSeconds: 12, words: [] };
        const spacesOnly = cue(11, 12, "   ");

        assert.equal(isValid({ cues: [blankWord] }), false);
        assert.equal(isValid({ cues: [spacesOnly] }), false);
    });

    it("measures word length in characters, as the transcript cuts it, so an emoji fits", () => {
        const emoji = String.fromCodePoint(0x1f600);
        const atLimit = `${"a".repeat(MAX_CAPTION_WORD_LENGTH - 1)}${emoji}`;
        const overLimit = `${"a".repeat(MAX_CAPTION_WORD_LENGTH)}${emoji}`;

        assert.equal(isValid({ cues: [cue(11, 12, atLimit)] }), true);
        assert.equal(isValid({ cues: [cue(11, 12, overLimit)] }), false);
    });
});

describe("studioDraftSchema cues", () => {
    it("accepts cues that touch within 0.05 s", () => {
        assert.equal(isValid({ cues: [cue(11, 13), cue(12.96, 14)] }), true);
    });

    it("rejects cues that overlap by more than 0.05 s", () => {
        assert.equal(isValid({ cues: [cue(11, 13), cue(12.9, 14)] }), false);
    });

    it("rejects cues out of order", () => {
        assert.equal(isValid({ cues: [cue(20, 21), cue(11, 12)] }), false);
    });

    it("rejects a cue outside the clip, allowing 0.05 s at the edges", () => {
        assert.equal(isValid({ cues: [cue(9.96, 12), cue(38, 40.04)] }), true);
        assert.equal(isValid({ cues: [cue(9.9, 12)] }), false);
        assert.equal(isValid({ cues: [cue(38, 40.1)] }), false);
    });

    it("rejects a cue that ends before it starts", () => {
        assert.equal(isValid({ cues: [cue(12, 11)] }), false);
    });

    it("rejects a word outside its cue", () => {
        const wordOutside = {
            startSeconds: 11,
            endSeconds: 12,
            words: [{ text: "oi", startSeconds: 12.5, endSeconds: 13 }],
        };

        assert.equal(isValid({ cues: [wordOutside] }), false);
    });

    it("accepts 400 cues and rejects 401", () => {
        const cueSeconds = 0.2;
        const buildCues = (count: number): Array<CaptionCue> =>
            Array.from({ length: count }, (_, index) =>
                cue(index * cueSeconds, (index + 1) * cueSeconds),
            );
        const longClip = { startSeconds: 0, endSeconds: 90 };

        assert.equal(isValid({ ...longClip, cues: buildCues(MAX_CAPTION_CUES) }), true);
        assert.equal(isValid({ ...longClip, cues: buildCues(MAX_CAPTION_CUES + 1) }), false);
    });
});
