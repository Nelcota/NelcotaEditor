import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { studioDraftSchema } from "#/modules/clips/model/clip-studio";
import type { CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import { trimDraft } from "#/modules/studio/model/draft-trim";

const WORDS: Array<CaptionWord> = [
    { text: "a", startSeconds: 9.5, endSeconds: 9.9 },
    { text: "b", startSeconds: 9.9, endSeconds: 10.5 },
    { text: "c", startSeconds: 10.5, endSeconds: 11 },
];

function draftWithOneCue(): StudioDraft {
    return {
        startSeconds: 9.5,
        endSeconds: 40,
        aspectRatio: "vertical",
        captionStyle: "karaoke",
        captionColor: "yellow",
        captionSize: "medium",
        captionPosition: "bottom",
        captionFont: "montserrat",
        cues: [{ startSeconds: 9.5, endSeconds: 11, words: WORDS }],
    };
}

describe("trimDraft", () => {
    it("starts a cut cue at its first remaining word", () => {
        const draft = draftWithOneCue();

        const trimmed = trimDraft(draft, { startSeconds: 10, endSeconds: 40 }, WORDS);

        assert.equal(trimmed.cues[0]?.startSeconds, 10.5);
    });

    it("keeps the cues valid when the start moves back over a cut word", () => {
        const draft = draftWithOneCue();
        const trimmed = trimDraft(draft, { startSeconds: 10, endSeconds: 40 }, WORDS);

        const restored = trimDraft(trimmed, { startSeconds: 9.8, endSeconds: 40 }, WORDS);

        assert.equal(studioDraftSchema.safeParse(restored).success, true);
    });

    it("gives a word cut by the end back its length when the end grows again", () => {
        const draft = draftWithOneCue();
        const shortened = trimDraft(draft, { startSeconds: 9.5, endSeconds: 10.7 }, WORDS);

        const grown = trimDraft(shortened, { startSeconds: 9.5, endSeconds: 40 }, WORDS);

        assert.equal(grown.cues[0]?.words.at(-1)?.endSeconds, 11);
        assert.equal(grown.cues[0]?.endSeconds, 11);
    });

    it("keeps an uncut cue's own start", () => {
        const draft = draftWithOneCue();

        const trimmed = trimDraft(draft, { startSeconds: 9, endSeconds: 40 }, WORDS);

        assert.equal(trimmed.cues[0]?.startSeconds, 9.5);
    });
});
