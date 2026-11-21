import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/clips/clip-limits";
import { normalizeHighlights } from "#/modules/highlights/normalize-highlights";
import type { HighlightCandidate } from "#/modules/highlights/normalize-highlights";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";

const CENTISECONDS_PER_SECOND = 100;
const EM_DASH = String.fromCodePoint(0x2014);

/** One-second words back to back, from `fromSeconds` until `toSeconds`. */
function spokenWords(fromSeconds: number, toSeconds: number): Array<TranscriptWord> {
    const count = Math.round(toSeconds - fromSeconds);

    return Array.from({ length: count }, (_, index) => ({
        text: `w${index}`,
        startSeconds: fromSeconds + index,
        endSeconds: fromSeconds + index + 1,
    }));
}

function candidate(startSeconds: number, endSeconds: number, score: number): HighlightCandidate {
    return { startSeconds, endSeconds, title: `Clip ${score}`, reason: "Bom trecho", score };
}

function toCentiseconds(seconds: number): number {
    return Math.round(seconds * CENTISECONDS_PER_SECOND);
}

describe("normalizeHighlights", () => {
    it("snaps to word boundaries and pads the edges", () => {
        const words = spokenWords(0, 100);
        const result = normalizeHighlights([candidate(10.2, 39.7, 80)], {
            words,
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.equal(result.length, 1);
        const clip = result[0];
        assert.ok(clip !== undefined);
        assert.equal(toCentiseconds(clip.startSeconds), 985);
        assert.equal(toCentiseconds(clip.endSeconds), 4035);
    });

    it("accepts a clip that overlaps the previous one by 0.9 s (padding)", () => {
        const words = [...spokenWords(10, 30), ...spokenWords(29.6, 49.6)];
        const result = normalizeHighlights([candidate(10, 29.8, 90), candidate(29.55, 49.6, 80)], {
            words,
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.equal(result.length, 2);
        const first = result[0];
        const second = result[1];
        assert.ok(first !== undefined);
        assert.ok(second !== undefined);
        assert.equal(toCentiseconds(first.endSeconds - second.startSeconds), 90);
    });

    it("rejects a clip that overlaps an accepted one by 1.1 s", () => {
        const words = [...spokenWords(10, 30), ...spokenWords(29.4, 49.4)];
        const result = normalizeHighlights([candidate(10, 29.8, 90), candidate(29.6, 49.4, 80)], {
            words,
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.equal(result.length, 1);
        assert.equal(result[0]?.score, 90);
    });

    it("drops a candidate whose end is before its start", () => {
        const result = normalizeHighlights([candidate(40, 20, 90)], {
            words: spokenWords(0, 100),
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.deepEqual(result, []);
    });

    it("drops everything when the video is shorter than the minimum clip", () => {
        const result = normalizeHighlights([candidate(0, 12, 90)], {
            words: spokenWords(0, 12),
            durationSeconds: 12,
            maxCount: 5,
        });

        assert.ok(12 < MIN_CLIP_SECONDS);
        assert.deepEqual(result, []);
    });

    it("never lets the end padding push a clip at the 90 s limit past it", () => {
        const result = normalizeHighlights([candidate(10, 100, 90)], {
            words: spokenWords(0, 200),
            durationSeconds: 300,
            maxCount: 5,
        });

        const clip = result[0];
        assert.ok(clip !== undefined);
        const durationCentiseconds = toCentiseconds(clip.endSeconds - clip.startSeconds);
        assert.ok(durationCentiseconds <= MAX_CLIP_SECONDS * CENTISECONDS_PER_SECOND);
    });

    it("clamps a candidate longer than 90 s to 90 s from its start", () => {
        const result = normalizeHighlights([candidate(0, 200, 90)], {
            words: spokenWords(0, 200),
            durationSeconds: 300,
            maxCount: 5,
        });

        const clip = result[0];
        assert.ok(clip !== undefined);
        assert.equal(clip.startSeconds, 0);
        assert.ok(clip.endSeconds <= MAX_CLIP_SECONDS);
    });

    it("does not pad past the end of the video", () => {
        const result = normalizeHighlights([candidate(70, 100, 90)], {
            words: spokenWords(0, 100),
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.equal(result[0]?.endSeconds, 100);
    });

    it("throws for a NaN, zero or negative duration", () => {
        const options = { words: spokenWords(0, 100), maxCount: 5 };

        for (const durationSeconds of [Number.NaN, 0, -10, Number.POSITIVE_INFINITY]) {
            assert.throws(
                () => normalizeHighlights([candidate(10, 40, 90)], { ...options, durationSeconds }),
                RangeError,
            );
        }
    });

    it("throws for a count that is not a positive integer", () => {
        const options = { words: spokenWords(0, 100), durationSeconds: 100 };

        for (const maxCount of [0, -1, 1.5, Number.NaN]) {
            assert.throws(
                () => normalizeHighlights([candidate(10, 40, 90)], { ...options, maxCount }),
                RangeError,
            );
        }
    });

    it("returns nothing for an empty transcript or no candidates", () => {
        const fromEmptyTranscript = normalizeHighlights([candidate(10, 40, 90)], {
            words: [],
            durationSeconds: 100,
            maxCount: 5,
        });
        const fromNoCandidates = normalizeHighlights([], {
            words: spokenWords(0, 100),
            durationSeconds: 100,
            maxCount: 5,
        });

        assert.deepEqual(fromEmptyTranscript, []);
        assert.deepEqual(fromNoCandidates, []);
    });

    it("keeps the best scored clips and returns them in time order", () => {
        const candidates = [candidate(60, 90, 50), candidate(10, 40, 70), candidate(110, 140, 95)];
        const result = normalizeHighlights(candidates, {
            words: spokenWords(0, 200),
            durationSeconds: 200,
            maxCount: 2,
        });

        assert.deepEqual(
            result.map((clip) => clip.score),
            [70, 95],
        );
    });

    it("rounds and clamps the score and removes dashes from the copy", () => {
        const dirty = {
            ...candidate(10, 40, 250.4),
            title: `Abertura ${EM_DASH} o gancho`,
            reason: `  Motivo ${EM_DASH}  bom  `,
        };
        const result = normalizeHighlights([dirty], {
            words: spokenWords(0, 100),
            durationSeconds: 100,
            maxCount: 1,
        });

        const clip = result[0];
        assert.ok(clip !== undefined);
        assert.equal(clip.score, 100);
        assert.equal(clip.title, "Abertura, o gancho");
        assert.equal(clip.reason, "Motivo, bom");
    });
});
