import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    groupWordsIntoCues,
    toClipRelativeCues,
    toCue,
    wordsInsideRange,
} from "#/modules/clips/model/caption-cues";
import type { CaptionWord } from "#/modules/clips/model/clip-studio";

function word(text: string, startSeconds: number, endSeconds: number): CaptionWord {
    return { text, startSeconds, endSeconds };
}

function cueTexts(words: Array<CaptionWord>): Array<Array<string>> {
    return groupWordsIntoCues(words).map((cue) => cue.words.map((item) => item.text));
}

describe("groupWordsIntoCues", () => {
    it("returns no cues for no words", () => {
        assert.deepEqual(groupWordsIntoCues([]), []);
    });

    it("groups at most three words per cue", () => {
        const words = ["a", "b", "c", "d", "e"].map((text, index) =>
            word(text, index * 0.3, index * 0.3 + 0.25),
        );

        assert.deepEqual(cueTexts(words), [
            ["a", "b", "c"],
            ["d", "e"],
        ]);
    });

    it("breaks after punctuation", () => {
        const words = [
            word("Oi,", 0, 0.2),
            word("tudo", 0.25, 0.4),
            word("bem?", 0.45, 0.6),
            word("Sim", 0.65, 0.8),
        ];

        assert.deepEqual(cueTexts(words), [["Oi,"], ["tudo", "bem?"], ["Sim"]]);
    });

    it("breaks on a pause longer than 0.6 s and not on a shorter one", () => {
        const words = [word("um", 0, 1), word("dois", 1.59, 2), word("três", 2.61, 3)];

        assert.deepEqual(cueTexts(words), [["um", "dois"], ["três"]]);
    });

    it("keeps a pause of exactly 0.60 s in the same cue", () => {
        const words = [word("um", 1.5, 2), word("dois", 2.6, 3)];

        assert.deepEqual(cueTexts(words), [["um", "dois"]]);
    });

    it("spans the cue from the first word start to the last word end", () => {
        const cues = groupWordsIntoCues([word("a", 1, 1.2), word("b", 1.3, 1.7)]);

        assert.equal(cues.length, 1);
        assert.equal(cues[0]?.startSeconds, 1);
        assert.equal(cues[0]?.endSeconds, 1.7);
    });
});

describe("toCue", () => {
    it("returns null for no words", () => {
        assert.equal(toCue([]), null);
    });
});

describe("wordsInsideRange", () => {
    it("keeps words that start inside and cuts one that runs past the end", () => {
        const words = [
            word("antes", 9, 10.2),
            word("dentro", 10, 11),
            word("borda", 19.5, 20.5),
            word("depois", 20, 21),
        ];
        const inside = wordsInsideRange(words, { startSeconds: 10, endSeconds: 20 });

        assert.deepEqual(inside, [word("dentro", 10, 11), word("borda", 19.5, 20)]);
    });

    it("returns nothing for an empty list", () => {
        assert.deepEqual(wordsInsideRange([], { startSeconds: 0, endSeconds: 10 }), []);
    });
});

describe("toClipRelativeCues", () => {
    it("shifts cue and word times to the clip start and never below zero", () => {
        const cues = [{ startSeconds: 9.5, endSeconds: 12, words: [word("oi", 9.5, 12)] }];
        const relative = toClipRelativeCues(cues, 10);

        assert.deepEqual(relative, [{ startSeconds: 0, endSeconds: 2, words: [word("oi", 0, 2)] }]);
    });
});
