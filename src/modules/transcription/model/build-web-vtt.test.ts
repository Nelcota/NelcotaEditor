import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWebVtt, formatVttTimestamp } from "#/modules/transcription/model/build-web-vtt";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";

function word(text: string, startSeconds: number, endSeconds: number): TranscriptWord {
    return { text, startSeconds, endSeconds };
}

describe("formatVttTimestamp", () => {
    it("writes hours, minutes, seconds and milliseconds", () => {
        assert.equal(formatVttTimestamp(3_723.456), "01:02:03.456");
    });

    it("rounds to the nearest millisecond", () => {
        assert.equal(formatVttTimestamp(1.9996), "00:00:02.000");
    });

    it("refuses negative and non-finite times", () => {
        assert.throws(() => formatVttTimestamp(-1), RangeError);
        assert.throws(() => formatVttTimestamp(Number.NaN), RangeError);
    });
});

describe("buildWebVtt", () => {
    it("writes only the header for a silent video", () => {
        assert.equal(buildWebVtt([]), "WEBVTT\n");
    });

    it("ends a cue at the end of a sentence", () => {
        const words = [word("Oi.", 0, 0.5), word("Tudo", 1, 1.4), word("bem?", 1.4, 2)];

        assert.equal(
            buildWebVtt(words),
            "WEBVTT\n\n00:00:00.000 --> 00:00:00.500\nOi.\n\n00:00:01.000 --> 00:00:02.000\nTudo bem?\n",
        );
    });

    it("starts a new cue before one grows past six seconds", () => {
        const words = [word("um", 0, 1), word("dois", 3, 4), word("três", 6, 7)];
        const captions = buildWebVtt(words);

        assert.match(captions, /00:00:00\.000 --> 00:00:04\.000\num dois/);
        assert.match(captions, /00:00:06\.000 --> 00:00:07\.000\ntrês/);
    });

    it("escapes text a player would read as markup", () => {
        const captions = buildWebVtt([word("<b>A&B</b>", 0, 1)]);

        assert.match(captions, /&lt;b&gt;A&amp;B&lt;\/b&gt;/);
    });
});
